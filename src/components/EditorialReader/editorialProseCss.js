/* Prose typography for the editorial reading column — shared by EditorialReader
   (epub sections) and TextEditionReader (markdown sections). The first paragraph
   of the whole book carries the crimson drop cap. */
export const editorialProseCss = `
  [data-editorial-section] {
    font-family: 'Newsreader', Georgia, 'Times New Roman', serif;
    font-weight: 300;
    line-height: 1.95;
    color: #c9c5b8;
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
    color: #ece9e0;
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
    color: #d41f3d;
    text-decoration: none;
    border-bottom: 1px solid rgba(212, 31, 61, 0.35);
  }
  [data-editorial-section] a:hover { color: #ece9e0; }
  [data-editorial-section] em,
  [data-editorial-section] i { font-style: italic; color: inherit; }
  [data-editorial-section] blockquote,
  [data-editorial-section] .indentb,
  [data-editorial-section] .quoteb {
    border-left: 2px solid #b3122e;
    padding-left: 1.4em;
    margin: 1.8em 0;
    font-style: italic;
    color: #a5a194;
  }
  [data-editorial-section] hr {
    border: none;
    border-top: 1px solid #1c202b;
    margin: 3em auto;
    width: 40%;
  }
  [data-editorial-section] img {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 2em auto;
    border: 1px solid #262a35;
    padding: 6px;
    background: #10131b;
  }
  [data-editorial-section] table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.8em 0;
    font-size: 0.92em;
  }
  [data-editorial-section] td,
  [data-editorial-section] th {
    border: 1px solid #1c202b;
    padding: 8px 10px;
    text-align: left;
  }
  [data-editorial-section] th {
    font-family: 'Outfit', system-ui, sans-serif;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #a5a194;
  }
  [data-editorial-section] sup,
  [data-editorial-section] .enote { color: #d41f3d; }
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
    color: #d41f3d;
  }
`;
