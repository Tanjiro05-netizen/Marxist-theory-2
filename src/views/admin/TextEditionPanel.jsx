import React, { useState, useCallback } from 'react';
import { FileText, Loader2, Plus, Trash2, ChevronUp, ChevronDown, Wand2, ClipboardPaste } from 'lucide-react';
import { detectKind, splitSource, readingMinutes } from '../../utils/textEdition';
import { reconstructFromPdfPages } from '../../utils/pdfTextReconstruct';

/**
 * Admin panel for building a book's text edition — the markdown sections
 * rendered by TextEditionReader for books without an EPUB.
 *
 * Sources (in order of fidelity): upload/paste a .md or .txt file, or fall
 * back to extracting the PDF's text layer with pdf.js (lazily imported).
 * The parent owns the sections state so everything saves with the main form.
 */
const TextEditionPanel = ({ sections, source, onSectionsChange, onSourceChange, onDirty, pdfFile, pdfUrl }) => {
    const [pasteOpen, setPasteOpen] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const [extracting, setExtracting] = useState(false);
    const [extractStep, setExtractStep] = useState('');
    const [scanWarning, setScanWarning] = useState(false);
    const [panelError, setPanelError] = useState(null);

    const applySections = useCallback((next, nextSource) => {
        onSectionsChange(next);
        onSourceChange(nextSource);
        onDirty(true);
        setScanWarning(false);
        setPanelError(null);
    }, [onSectionsChange, onSourceChange, onDirty]);

    const handleTextFile = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        try {
            const text = await file.text();
            const kind = detectKind(file.name, text);
            applySections(splitSource(kind, text), kind);
        } catch (err) {
            setPanelError(`Could not read ${file.name}: ${err.message}`);
        }
    }, [applySections]);

    const handlePasteImport = useCallback(() => {
        const text = pasteText.trim();
        if (!text) return;
        const kind = detectKind('', text);
        applySections(splitSource(kind, text), kind);
        setPasteText('');
        setPasteOpen(false);
    }, [pasteText, applySections]);

    const handleExtractPdf = useCallback(async () => {
        if (!pdfFile && !pdfUrl) {
            setPanelError('No PDF available to extract from.');
            return;
        }
        setExtracting(true);
        setPanelError(null);
        setExtractStep('Loading pdf.js…');
        try {
            const pdfjs = await import('pdfjs-dist');
            pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

            let doc;
            if (pdfFile) {
                const buffer = await pdfFile.arrayBuffer();
                doc = await pdfjs.getDocument({ data: buffer }).promise;
            } else {
                doc = await pdfjs.getDocument({ url: pdfUrl }).promise;
            }

            const pages = [];
            for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
                setExtractStep(`Extracting page ${pageNum} / ${doc.numPages}…`);
                const page = await doc.getPage(pageNum);
                const content = await page.getTextContent();
                pages.push(content.items);
                page.cleanup();
            }

            const { sections: extracted, stats } = reconstructFromPdfPages(pages);
            if (stats.likelyScanned) setScanWarning(true);
            applySections(extracted, 'extracted');
        } catch (err) {
            console.error('[TextEditionPanel] PDF extraction failed:', err);
            setPanelError(`Extraction failed: ${err.message || err}`);
        } finally {
            setExtracting(false);
            setExtractStep('');
        }
    }, [pdfFile, pdfUrl, applySections]);

    const updateSection = (index, patch) => {
        onSectionsChange(sections.map((sec, i) => (i === index ? { ...sec, ...patch } : sec)));
        onDirty(true);
    };

    const moveSection = (index, delta) => {
        const target = index + delta;
        if (target < 0 || target >= sections.length) return;
        const next = [...sections];
        const [moved] = next.splice(index, 1);
        next.splice(target, 0, moved);
        onSectionsChange(next);
        onDirty(true);
    };

    const removeSection = (index) => {
        onSectionsChange(sections.filter((_, i) => i !== index));
        onDirty(true);
    };

    const addSection = () => {
        onSectionsChange([...sections, { id: `s${Date.now()}`, title: '', level: 1, md: '' }]);
        onDirty(true);
    };

    const totalWords = sections.reduce((sum, sec) => sum + `${sec.md || ''}`.split(/\s+/).filter(Boolean).length, 0);

    const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none';

    return (
        <div className="bg-gray-900/50 rounded-none p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="text-red-500" size={20} />
                    Text Edition
                </h3>
                {sections.length > 0 && (
                    <span className="text-xs text-gray-400 font-mono">
                        {sections.length} sections · {totalWords.toLocaleString()} words · ~{readingMinutes(sections.map((s) => s.md || '').join('\n'))} min · {source}
                    </span>
                )}
            </div>

            <p className="text-xs text-gray-500">
                The reflowable reading edition — separate from the EPUB readers and the PDF download.
                Upload or paste a text file (.txt or .md — preferred; # headings become sections), or
                extract the PDF text layer as a fallback.
            </p>

            {/* Import controls */}
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 transition-colors cursor-pointer rounded-none font-medium">
                    <FileText size={16} />
                    Upload .txt / .md
                    <input
                        type="file"
                        accept=".md,.markdown,.txt,text/markdown,text/plain"
                        onChange={handleTextFile}
                        className="hidden"
                    />
                </label>
                <button
                    type="button"
                    onClick={() => setPasteOpen((v) => !v)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 transition-colors rounded-none font-medium text-gray-200"
                >
                    <ClipboardPaste size={16} />
                    Paste text
                </button>
                {(pdfFile || pdfUrl) && (
                    <button
                        type="button"
                        onClick={handleExtractPdf}
                        disabled={extracting}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-50 transition-colors rounded-none font-medium text-gray-200"
                    >
                        {extracting ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                        {extracting ? (extractStep || 'Extracting…') : 'Extract from PDF'}
                    </button>
                )}
                {sections.length > 0 && (
                    <button
                        type="button"
                        onClick={() => { if (window.confirm('Remove the whole text edition? The PDF stays untouched.')) applySections([], source); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 hover:bg-red-900/40 transition-colors rounded-none font-medium text-gray-400 hover:text-red-300"
                    >
                        <Trash2 size={16} />
                        Clear
                    </button>
                )}
            </div>

            {pasteOpen && (
                <div className="space-y-2">
                    <textarea
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        rows={10}
                        className={`${inputClass} font-mono text-xs resize-y`}
                        placeholder={'Paste markdown (preferred — # headings split sections)\nor plain text (Chapter/ALL-CAPS lines are detected)…'}
                    />
                    <button
                        type="button"
                        onClick={handlePasteImport}
                        disabled={!pasteText.trim()}
                        className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors rounded-none font-medium"
                    >
                        Import pasted text
                    </button>
                </div>
            )}

            {panelError && (
                <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-none text-red-300 text-sm flex items-center gap-2">
                    <span>{panelError}</span>
                </div>
            )}

            {scanWarning && (
                <div className="p-3 bg-yellow-900/40 border border-yellow-500/40 rounded-none text-yellow-300 text-sm">
                    This PDF appears to be scanned — almost no text layer was found. Review the extraction
                    carefully or paste/upload a text file instead.
                </div>
            )}

            {/* Section editor */}
            {sections.length > 0 && (
                <div className="space-y-4">
                    {sections.map((sec, index) => (
                        <div key={sec.id || index} className="border border-gray-800 bg-gray-900/60 rounded-none p-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-mono w-8 flex-shrink-0">{String(index + 1).padStart(2, '0')}</span>
                                <input
                                    type="text"
                                    value={sec.title || ''}
                                    onChange={(e) => updateSection(index, { title: e.target.value })}
                                    placeholder="Section title (rail label)"
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-none px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                />
                                <select
                                    value={sec.level || 1}
                                    onChange={(e) => updateSection(index, { level: parseInt(e.target.value, 10) })}
                                    className="bg-gray-800 border border-gray-700 rounded-none px-2 py-1.5 text-xs text-gray-300 outline-none"
                                    title="Indentation level in the reader rail"
                                >
                                    {[1, 2, 3].map((lvl) => (
                                        <option key={lvl} value={lvl}>L{lvl}</option>
                                    ))}
                                </select>
                                <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} className="p-1 text-gray-400 hover:text-white disabled:opacity-30" aria-label="Move section up">
                                    <ChevronUp size={16} />
                                </button>
                                <button type="button" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1} className="p-1 text-gray-400 hover:text-white disabled:opacity-30" aria-label="Move section down">
                                    <ChevronDown size={16} />
                                </button>
                                <button type="button" onClick={() => removeSection(index)} className="p-1 text-gray-400 hover:text-red-400" aria-label="Remove section">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <textarea
                                value={sec.md || ''}
                                onChange={(e) => updateSection(index, { md: e.target.value })}
                                rows={Math.min(14, Math.max(4, Math.ceil((sec.md || '').length / 90)))}
                                className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-xs text-gray-200 font-mono resize-y focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                placeholder="Section body (markdown)"
                            />
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addSection}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 transition-colors rounded-none font-medium text-gray-200"
                    >
                        <Plus size={16} />
                        Add section
                    </button>
                </div>
            )}
        </div>
    );
};

export default TextEditionPanel;
