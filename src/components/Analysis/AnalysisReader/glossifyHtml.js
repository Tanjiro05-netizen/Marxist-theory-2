/* String-level glossary annotation for analysis sections.
   Sections render as sanitized HTML strings, so the React-child-walking
   NerRenderer can't be used here. This wraps recognized glossary terms in
   .ar-gloss-term spans (tag-safe: only text between tags is touched). */

const escapeRegExp = (value) => value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

export const buildGlossaryIndex = (terms) => {
  const cleaned = (terms || [])
    .map((t) => ({ ...t, term: `${t.term || ''}`.trim() }))
    .filter((t) => t.term.length > 2);
  if (!cleaned.length) return null;

  cleaned.sort((a, b) => b.term.length - a.term.length);
  const byLower = new Map(cleaned.map((t) => [t.term.toLowerCase(), t]));
  const pattern = cleaned.map((t) => escapeRegExp(t.term)).join('|');
  try {
    return { regex: new RegExp(`\\b(${pattern})\\b`, 'g'), byLower };
  } catch {
    return null;
  }
};

export const glossifyHtml = (html, index) => {
  if (!index || !html) return html;
  // Split keeping tags; only annotate the non-tag chunks.
  const chunks = html.split(/(<[^>]*>)/);
  return chunks
    .map((chunk) => {
      if (!chunk || chunk.startsWith('<')) return chunk;
      return chunk.replace(index.regex, (match) => {
        const entry = index.byLower.get(match.toLowerCase());
        if (!entry) return match;
        return `<span class="ar-gloss-term" data-gloss-term="${match.replace(/"/g, '&quot;')}" title="${(entry.type || 'term').replace(/"/g, '&quot;')}">${match}</span>`;
      });
    })
    .join('');
};
