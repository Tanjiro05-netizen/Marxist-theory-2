#!/usr/bin/env node
/**
 * Ingest a folder of .txt texts into digital_library_books as text editions.
 *
 *   node scripts/ingest-texts.mjs <folder>                    # dry-run: report only
 *   node scripts/ingest-texts.mjs <folder> --sql out.sql      # emit INSERT statements
 *   node scripts/ingest-texts.mjs <folder> --apply            # write via Supabase REST
 *                                                            #   (needs SUPABASE_SERVICE_ROLE_KEY)
 *
 * Reads the communist-left.org scrape header (title + Source URL), splits the
 * body into nested sections, and stores { text_edition }. Author/category are
 * left empty for the admin panel. Re-runs skip titles already in the library.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseSourceFile, splitPlainText, buildEdition } from '../src/utils/textEdition.js';

const args = process.argv.slice(2);
const folder = args.find((a) => !a.startsWith('--'));
const doSql = args.includes('--sql');
const sqlOut = args.find((a) => !a.startsWith('--') && a !== folder) || 'ingest-texts.sql';
const doApply = args.includes('--apply');

if (!folder) {
    console.error('Usage: node scripts/ingest-texts.mjs <folder> [--sql <file>] [--apply]');
    process.exit(1);
}

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

const sqlLiteral = (value) => (value === null || value === undefined ? 'NULL' : `'${String(value).replace(/'/g, "''")}'`);
const sqlJsonb = (value) => `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;

const run = async () => {
    const env = { ...(await readEnvLocal()), ...process.env };
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.REACT_APP_SUPABASE_URL;
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.REACT_APP_SUPABASE_ANON_KEY;

    const files = (await readdir(folder)).filter((f) => /\.txt$/i.test(f)).sort();
    if (!files.length) {
        console.error(`No .txt files found in ${folder}`);
        process.exit(1);
    }

    // Idempotency: skip titles already present.
    let existingTitles = new Set();
    if (supabaseUrl && anonKey) {
        try {
            const res = await fetch(`${supabaseUrl}/rest/v1/digital_library_books?select=title`, {
                headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
            });
            const rows = await res.json();
            if (Array.isArray(rows)) existingTitles = new Set(rows.map((r) => r.title));
        } catch (err) {
            console.warn(`Could not fetch existing titles (${err.message}); duplicates not filtered.`);
        }
    }

    const inserts = [];
    let skipped = 0;

    for (const file of files) {
        const raw = await readFile(join(folder, file), 'utf8');
        const { title, sourceUrl, body } = parseSourceFile(raw);

        const bookTitle = title || file.replace(/\.txt$/i, '');
        if (existingTitles.has(bookTitle)) {
            skipped += 1;
            console.log(`  = ${bookTitle} (already in library, skipped)`);
            continue;
        }

        const sections = splitPlainText(body);
        const edition = buildEdition(sections, 'txt');
        // Keep the source attribution in the front-matter section
        if (sourceUrl) {
            const fm = edition.sections[0];
            if (fm && fm.title === 'Front matter') {
                fm.md = `Source: ${sourceUrl}\n\n${fm.md}`.trim();
            } else {
                edition.sections.unshift({ id: 's0', title: 'Front matter', level: 1, md: `Source: ${sourceUrl}` });
            }
        }

        const levels = edition.sections.reduce((acc, s) => ({ ...acc, [s.level]: (acc[s.level] || 0) + 1 }), {});
        console.log(
            `+ ${bookTitle}\n    ${edition.sections.length} sections (L1:${levels[1] || 0} L2:${levels[2] || 0} L3:${levels[3] || 0}) · ${edition.reading_minutes} min`
        );

        inserts.push({
            title: bookTitle,
            language: 'English',
            is_official: true,
            text_edition: edition,
        });
    }

    console.log(`\n${inserts.length} books prepared, ${skipped} skipped (already present).`);

    if (doSql) {
        const statements = inserts.map((book) => {
            const edition = { ...book.text_edition };
            const cols = ['title', 'language', 'is_official', 'text_edition'];
            const vals = [sqlLiteral(book.title), sqlLiteral(book.language), book.is_official, sqlJsonb(edition)];
            return `insert into public.digital_library_books (${cols.join(', ')})\nselect ${vals.join(', ')}\nwhere not exists (select 1 from public.digital_library_books b where b.title = ${sqlLiteral(book.title)});`;
        });
        await writeFile(sqlOut, statements.join('\n\n') + '\n');
        console.log(`SQL written to ${sqlOut} — run it in the Supabase SQL editor after the migration.`);
    }

    if (doApply) {
        if (!supabaseUrl || !serviceKey) {
            console.error('--apply needs SUPABASE_SERVICE_ROLE_KEY (env or .env.local) and NEXT_PUBLIC_SUPABASE_URL.');
            process.exit(1);
        }
        let ok = 0;
        let failed = 0;
        for (const book of inserts) {
            const res = await fetch(`${supabaseUrl}/rest/v1/digital_library_books`, {
                method: 'POST',
                headers: {
                    apikey: serviceKey,
                    Authorization: `Bearer ${serviceKey}`,
                    'Content-Type': 'application/json',
                    Prefer: 'return=minimal',
                },
                body: JSON.stringify(book),
            });
            if (res.ok) ok += 1;
            else {
                failed += 1;
                console.error(`  ! ${book.title}: ${res.status} ${await res.text()}`);
            }
        }
        console.log(`Applied: ${ok} inserted, ${failed} failed.`);
    }

    if (!doSql && !doApply) {
        console.log('\nDry run only. Re-run with --sql <file> or --apply to write.');
    }
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
