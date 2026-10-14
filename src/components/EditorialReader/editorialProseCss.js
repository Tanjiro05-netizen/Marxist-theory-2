/* Prose typography for the editorial reading column — shared by EditorialReader
   (epub sections) and TextEditionReader (markdown sections). The first paragraph
   of the whole book carries the crimson drop cap. */
export const editorialProseCss = `
  [data-editorial-section] {
    font-family: 'Newsreader', Georgia, 'Times New Roman', serif;
    font-weight: 300;
    line-height: 1.95;
    color: var(--paper-soft);
    text-align: left;
  }
  [data-editorial-section] h1,
  [data-editorial-section] h2,
  [data-editorial-section] h3,
  [data-editorial-section] h4,
  [data-editorial-section] h5,
  [data-editorial-section] h6,
  [data-editorial-section] .H,
  [data-editorial-section] .H1 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-weight: 500;
    color: var(--paper);
    line-height: 1.2;
    margin: 2.2em 0 0.8em;
    letter-spacing: 0.01em;
  }
  [data-editorial-section] h1 { font-size: 1.9em; }
  [data-editorial-section] h2 { font-size: 1.6em; }
  [data-editorial-section] h3 { font-size: 1.35em; }
  [data-editorial-section] p {
    margin: 0 0 1.15em;
    padding: 0;
  }
  [data-editorial-section] a {
    color: var(--red-bright);
    text-decoration: none;
    border-bottom: 1px solid rgba(155, 16, 34, 0.4);
  }
  [data-editorial-section] a:hover { color: var(--paper); }
  [data-editorial-section] em,
  [data-editorial-section] i { font-style: italic; color: inherit; }
  [data-editorial-section] blockquote,
  [data-editorial-section] .indentb,
  [data-editorial-section] .quoteb {
    border-left: 2px solid #b3122e;
    padding-left: 1.4em;
    margin: 1.8em 0;
    font-style: italic;
    color: var(--paper-dim);
  }
  [data-editorial-section] hr {
    border: none;
    border-top: 1px solid var(--line-soft);
    margin: 3em auto;
    width: 40%;
  }
  [data-editorial-section] img {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 2em auto;
    border: 1px solid var(--line);
    padding: 6px;
    background: var(--ink-2);
  }
  [data-editorial-section] table {
    width: 100%;
    max-width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    margin: 1.8em 0;
    font-size: 0.92em;
  }
  [data-editorial-section] td,
  [data-editorial-section] th {
    border: 1px solid var(--line-soft);
    padding: 8px 10px;
    text-align: left;
    overflow-wrap: anywhere;
  }
  [data-editorial-section] th {
    font-family: 'Outfit', system-ui, sans-serif;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--paper-dim);
  }
  [data-editorial-section] sup,
  [data-editorial-section] .enote { color: var(--red-bright); }
  [data-editorial-section] ::selection { background: rgba(179, 18, 46, 0.55); color: #fff; }

  /* The drop cap — only the very first paragraph of the book */
  [data-editorial-section="true"]:first-of-type > p:first-of-type::first-letter,
  [data-editorial-section="true"]:first-of-type > p:first-child::first-letter {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-weight: 600;
    font-size: 3.4em;
    float: left;
    line-height: 0.8;
    padding-right: 0.14em;
    padding-top: 0.06em;
    color: var(--red-bright);
  }

  /* Search hits arriving from /digital-library?q= — mark.js wraps each
     match; the flash class lands on the hit the page scrolled to. */
  mark.search-hit {
    background: rgba(179, 18, 46, 0.30);
    color: inherit;
    padding: 0 1px;
  }
  mark.search-hit.search-hit-flash {
    animation: search-hit-flash 1.8s ease-out 1 both;
  }
  @keyframes search-hit-flash {
    0%, 35% { background: rgba(179, 18, 46, 0.9); color: #f5f0e6; }
    100% { background: rgba(179, 18, 46, 0.30); color: inherit; }
  }
`;
