#!/usr/bin/env node
/**
 * Build text_editions for EPUB-only library books so their interiors become
 * searchable through search_library_text() (the sync trigger reindexes
 * automatically on write). Books that already have a text edition are left
 * alone unless --rebuild is passed.
 *
 *   node scripts/ingest-epub-texts.mjs                    # dry-run: parse + report, no writes
 *   node scripts/ingest-epub-texts.mjs --apply            # write text_edition via Supabase REST
 *                                                         #   (needs SUPABASE_SERVICE_ROLE_KEY)
 *   node scripts/ingest-epub-texts.mjs --file book.epub   # parse a local EPUB, print stats only
 *   node scripts/ingest-epub-texts.mjs --rebuild --apply  # redo books that already have editions
 */

import { readFile } from 'node:fs/promises';
import { parseEpubBuffer } from '../src/utils/epubTextExtractor.js';

const args = process.argv.slice(2);
const doApply = args.includes('--apply');
const doRebuild = args.includes('--rebuild');
const fileIdx = args.indexOf('--file');
const localFile = fileIdx !== -1 ? args[fileIdx + 1] : null;

const readEnvLocal = async () => {
    try {
        const raw = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
        const env = {};
        for (const line of raw.split('\n')) {
            const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
            if (match) env[match[1]] = match[2];
        }
        return env;
    } catch {
        return {};
    }
};

const wordCount = (edition) =>
    (edition.sections || []).map((s) => s.md || '').join(' ').split(/\s+/).filter(Boolean).length;

const reportRow = (book, edition, note) => {
    const words = edition ? wordCount(edition) : 0;
    console.log(
        `  ${note.padEnd(10)} ${(edition?.sections?.length ?? 0)} sections / ${String(words).padStart(6)} words  ${book.title}${book.epub_filename ? ` (${book.epub_filename})` : ''}`
    );
};

const main = async () => {
    // Local file mode: just prove the parser, never touch the database.
    if (localFile) {
        const buffer = await readFile(localFile);
        const { title, edition } = await parseEpubBuffer(buffer);
        console.log(`Parsed ${localFile}`);
        console.log(`  dc:title: ${title || '(none)'}`);
        reportRow({ title: title || localFile }, edition, 'parsed');
        for (const section of edition.sections.slice(0, 8)) {
            console.log(`    - ${section.title || '(untitled)'} [${section.md.length} chars]`);
        }
        return;
    }

    const env = { ...(await readEnvLocal()), ...process.env };
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
        console.error('Missing NEXT_PUBLIC_SUPABASE_URL (env or .env.local).');
        process.exit(1);
    }
    if (doApply && !serviceKey) {
        console.error('--apply needs SUPABASE_SERVICE_ROLE_KEY (env or .env.local).');
        process.exit(1);
    }

    const listRes = await fetch(
        `${supabaseUrl}/rest/v1/digital_library_books?select=id,title,epub_filename,text_edition&epub_filename=not.is.null&order=title.asc`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    if (!listRes.ok) {
        console.error(`Could not list books: ${listRes.status} ${await listRes.text()}`);
        process.exit(1);
    }
    const books = await listRes.json();
    const targets = books.filter(
        (book) => doRebuild || !(book.text_edition && Array.isArray(book.text_edition.sections) && book.text_edition.sections.length > 0)
    );

    console.log(
        `${books.length} books with EPUBs, ${targets.length} ${doRebuild ? 'selected for rebuild' : 'without a text edition'}.\n`
    );
    if (targets.length === 0) return;

    let ok = 0;
    let failed = 0;
    for (const book of targets) {
        try {
            const epubRes = await fetch(
                `${supabaseUrl}/storage/v1/object/public/library/${encodeURIComponent(book.epub_filename)}`
            );
            if (!epubRes.ok) throw new Error(`EPUB download failed: ${epubRes.status}`);
            const buffer = Buffer.from(await epubRes.arrayBuffer());
            const { edition } = await parseEpubBuffer(buffer);
            if (!edition.sections.length) throw new Error('no sections extracted');

            if (!doApply) {
                reportRow(book, edition, 'dry-run');
                continue;
            }

            const patchRes = await fetch(
                `${supabaseUrl}/rest/v1/digital_library_books?id=eq.${encodeURIComponent(book.id)}`,
                {
                    method: 'PATCH',
                    headers: {
                        apikey: serviceKey,
                        Authorization: `Bearer ${serviceKey}`,
                        'Content-Type': 'application/json',
                        Prefer: 'return=minimal',
                    },
                    body: JSON.stringify({ text_edition: edition }),
                }
            );
            if (!patchRes.ok) throw new Error(`PATCH failed: ${patchRes.status} ${await patchRes.text()}`);
            reportRow(book, edition, 'applied');
            ok += 1;
        } catch (err) {
            failed += 1;
            console.error(`  FAILED     ${book.title} (${book.epub_filename}): ${err.message}`);
        }
    }

    console.log(
        doApply
            ? `\nDone: ${ok} applied, ${failed} failed. Search index updates automatically via trigger.`
            : '\nDry run only. Re-run with --apply to write these text editions.'
    );
    if (failed > 0 && doApply) process.exit(1);
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
