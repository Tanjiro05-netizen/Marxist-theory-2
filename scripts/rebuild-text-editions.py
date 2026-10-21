#!/usr/bin/env python3
"""
Rebuild digital_library_books.text_edition from the source sites' HTML.

  python3 scripts/rebuild-text-editions.py            # dry-run: report + snapshots
  python3 scripts/rebuild-text-editions.py --apply    # PATCH Supabase rows

The 59 official text editions were ingested from lossy .txt scrapes: inline
elements arrived as hard line breaks, tables were shredded into hundreds of
stub sections, and every front matter began with a "Source: <url>" line. The
source pages themselves are well-structured HTML, so this script re-derives
the editions from them:

  - communist-left.org (51 texts): semantic HTML — h2/h3/h4 headings,
    <p> paragraphs with em/strong, real <table>s, lists, footnotes.
  - international-communist-party.org (8 texts): 1990s layout-table HTML —
    szXLb/szLb/span.szL heading classes, <b>N – Title</b> paragraph leads,
    <br>-separated flow.

Pages are cached under scripts/.html-cache/. A backup of the current
text_edition payload is written before anything is applied.
"""

import hashlib
import html as html_mod
import json
import os
import re
import sys
import time
import urllib.request
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '.html-cache')
BACKUP = os.path.join(HERE, '.text-edition-backup-2026-10-05.json')

SUPABASE_URL = 'https://yghsprwrzgfegvfbjmkq.supabase.co'

# ---------------------------------------------------------------------- #
# tiny DOM                                                               #
# ---------------------------------------------------------------------- #

class Node:
    __slots__ = ('tag', 'attrs', 'children', 'parent')

    def __init__(self, tag, attrs=None, parent=None):
        self.tag = tag
        self.attrs = dict(attrs or ())
        self.children = []
        self.parent = parent

    @property
    def classes(self):
        return set((self.attrs.get('class') or '').split())

    def text(self):
        out = []
        for c in self.children:
            if isinstance(c, str):
                out.append(c)
            else:
                out.append(c.text())
        return ''.join(out)


VOID = {'br', 'hr', 'img', 'meta', 'link', 'input', 'col', 'area', 'base', 'embed',
        'source', 'track', 'wbr'}


class TreeBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('#root')
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs, self.stack[-1])
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(Node(tag, attrs, self.stack[-1]))

    def handle_endtag(self, tag):
        for depth in range(len(self.stack) - 1, 0, -1):
            if self.stack[depth].tag == tag:
                del self.stack[depth:]
                return

    def handle_data(self, data):
        if data:
            self.stack[-1].children.append(data)


def parse_tree(html_text):
    builder = TreeBuilder()
    builder.feed(html_text)
    return builder.root


def find(node, pred):
    for c in node.children:
        if isinstance(c, str):
            continue
        if pred(c):
            return c
        found = find(c, pred)
        if found is not None:
            return found
    return None


def find_all(node, pred, out=None):
    out = [] if out is None else out
    for c in node.children:
        if not isinstance(c, str):
            if pred(c):
                out.append(c)
            find_all(c, pred, out)
    return out

# ---------------------------------------------------------------------- #
# inline markdown                                                        #
# ---------------------------------------------------------------------- #

SOFT_HYPHEN = '\u00ad'


def clean_text(s):
    s = s.replace('\u00a0', ' ').replace('\u2007', ' ').replace('\u202f', ' ')
    s = s.replace('\u2009', ' ').replace('\u2003', ' ').replace('\r', '')
    s = s.replace(SOFT_HYPHEN, '').replace('\u2011', '-').replace('\u00ad', '')
    s = re.sub(r'[ \t]{2,}', ' ', s)
    return s


def inline_md(node):
    """Inline content of a node as markdown (em/strong preserved)."""
    parts = []
    for c in node.children:
        if isinstance(c, str):
            parts.append(clean_text(c))
            continue
        tag = c.tag
        if tag == 'br':
            parts.append('\n')
        elif tag in ('i', 'em'):
            inner = inline_md(c).strip()
            if inner:
                parts.append(f'*{inner}*')
        elif tag in ('b', 'strong'):
            inner = inline_md(c).strip()
            if inner:
                parts.append(f'**{inner}**')
        elif tag == 'sup':
            if 'fnref' in c.classes:
                continue  # footnote reference marker
            inner = inline_md(c).strip()
            if inner:
                parts.append(inner)
        elif tag == 'sub':
            inner = inline_md(c).strip()
            if inner:
                parts.append(inner)
        elif tag in ('a', 'span', 'font', 'small', 'u', 'abbr', 'cite', 'q', 'var', 'samp', 'kbd'):
            parts.append(inline_md(c))
        elif tag in ('svg', 'img', 'button'):
            continue
        else:
            parts.append(inline_md(c))
    return ''.join(parts)


def para_md(p):
    md = inline_md(p)
    md = re.sub(r'\n+', '\n', md)
    # prose line-wrap newlines become spaces; explicit breaks stay rare
    lines = [l.strip() for l in md.split('\n')]
    lines = [l for l in lines if l]
    return ' '.join(lines) if len(lines) > 1 else '\n'.join(lines)

# ---------------------------------------------------------------------- #
# block markdown                                                         #
# ---------------------------------------------------------------------- #

def table_md(tbl):
    rows = []

    def cells(tr):
        out = []
        for c in tr.children:
            if isinstance(c, str):
                continue
            if c.tag in ('td', 'th'):
                cell = inline_md(c).replace('\n', ' ').strip()
                cell = re.sub(r'\s*·\s*', ' · ', cell)
                cell = cell.replace('|', '\\|')
                out.append(cell)
        return out

    for tr in find_all(tbl, lambda n: n.tag == 'tr'):
        # only direct-ish rows: skip rows of nested tables
        if any(a.tag == 'tr' and a is not tr for a in [tr]) :
            pass
        rows.append(cells(tr))
    # de-dup rows that came from nested tables (rows appear twice via find_all)
    deduped = []
    for r in rows:
        if r and r not in deduped[-1:] or (r and not deduped):
            deduped.append(r)
    rows = [r for r in deduped if r]
    if not rows:
        return ''
    width = max(len(r) for r in rows)
    rows = [r + [''] * (width - len(r)) for r in rows]
    lines = ['| ' + ' | '.join(rows[0]) + ' |', '|' + '---|' * width]
    for r in rows[1:]:
        lines.append('| ' + ' | '.join(r) + ' |')
    return '\n'.join(lines)


def list_md(node, ordered=False):
    items = []
    counter = 0
    for c in node.children:
        if isinstance(c, str) or c.tag != 'li':
            continue
        counter += 1
        inner = []
        for gc in c.children:
            if isinstance(gc, str):
                inner.append(clean_text(gc))
            elif gc.tag in ('ul', 'ol'):
                inner.append('\n' + list_md(gc, gc.tag == 'ol'))
            elif gc.tag == 'p':
                inner.append(para_md(gc))
            else:
                inner.append(inline_md(gc))
        item = ' '.join(s.strip() for s in inner if s.strip())
        item = re.sub(r'\s*\n\s*', '\n  ', item)
        items.append(f'{counter}. {item}' if ordered else f'- {item}')
    return '\n'.join(items)

# ---------------------------------------------------------------------- #
# modern site walker (communist-left.org)                                #
# ---------------------------------------------------------------------- #

class EditionBuilder:
    def __init__(self):
        self.sections = []
        self.counter = 0
        self.prelude = []

    def new_section(self, title, level):
        # Titles render styled by the readers — strip any inline markdown
        # markers (italic site headings arrive wrapped in asterisks).
        title = re.sub(r'\*+', '', clean_text(title)).strip()
        self.counter += 1
        sec = {'id': f's{self.counter}', 'title': title,
               'level': level, 'md': []}
        self.sections.append(sec)
        return sec

    def add(self, md):
        md = md.strip()
        if not md:
            return
        if not self.sections:
            self.prelude.append(md)
            return
        self.sections[-1]['md'].append(md)

    def finish(self):
        sections = []
        if self.prelude:
            self.counter += 1
            sections.append({'id': f's{self.counter}', 'title': 'Front matter',
                             'level': 1, 'md': '\n\n'.join(self.prelude).strip()})
        for sec in self.sections:
            sections.append({**sec, 'md': '\n\n'.join(sec['md']).strip()})
        # Keep titled sections with empty bodies: they are structural
        # chapter headings whose content lives in the sections after them.
        return [s for s in sections if s['md'] or (s['title'] and s['title'] != 'Front matter')]


def walk_modern(node, builder):
    for c in node.children:
        if isinstance(c, str):
            continue
        tag = c.tag
        cls = c.classes
        if tag in ('h2', 'h3', 'h4', 'h5', 'h6'):
            if 'eyebrow' in cls:
                continue
            level = {'h2': 1, 'h3': 2, 'h4': 3, 'h5': 3, 'h6': 3}[tag]
            builder.new_section(inline_md(c).strip(), level)
        elif tag == 'p':
            if cls & {'doc__tags', 'doc__note', 'doc__source', 'vh'}:
                continue
            builder.add(para_md(c))
        elif tag == 'table':
            builder.add(table_md(c))
        elif tag == 'div':
            if 'table-wrap' in cls:
                tbl = find(c, lambda n: n.tag == 'table')
                if tbl is not None:
                    builder.add(table_md(tbl))
            else:
                walk_modern(c, builder)
        elif tag == 'section':
            walk_modern(c, builder)
        elif tag == 'blockquote':
            md = '\n'.join('> ' + l for l in para_md(c).split('\n'))
            builder.add(md)
        elif tag == 'ul':
            builder.add(list_md(c, ordered=False))
        elif tag == 'ol':
            builder.add(list_md(c, ordered=True))
        elif tag == 'hr':
            builder.add('---')
        elif tag == 'pre':
            builder.add('```\n' + c.text().strip() + '\n```')
        elif tag == 'figure':
            cap = find(c, lambda n: n.tag == 'figcaption')
            if cap is not None:
                builder.add('*' + inline_md(cap).strip() + '*')
        # nav, footer, aside, svg etc. are skipped


BOLD_LEAD = re.compile(r'^\*\*(.+?)\*\*\s*[–—-]\s*(.*)$', re.S)


def extract_modern(html_text, title):
    tree = parse_tree(html_text)
    body = find(tree, lambda n: n.tag == 'div' and n.attrs.get('id') == 'text')
    if body is None:
        body = find(tree, lambda n: n.tag == 'article')
    builder = EditionBuilder()
    if body is not None:
        walk_modern(body, builder)
    sections = builder.finish()
    if not sections:
        return None
    # No headings at all and numbered leading paragraphs → split per number.
    if len(sections) == 1:
        md = sections[0]['md']
        paras = [p for p in md.split('\n\n') if p.strip()]
        marker_only = re.compile(r'^\*\*(?:\d{1,3}\.?|[IVXLC]{1,6})\*\*$')
        numbered = [p for p in paras if re.match(r'^\*\*(?:\d{1,3}\.|[IVXLC]{1,6})\*\*\s', p)]
        standalone = [p for p in paras if marker_only.match(p.strip())]
        if (len(numbered) >= 4 and len(numbered) >= len(paras) - 2) or len(standalone) >= 3:
            rebuilt = EditionBuilder()
            for p in paras:
                stripped = p.strip()
                m = re.match(r'^\*\*(.+?)\*\*\s*(.*)$', p, re.S)
                if m and (marker_only.match(stripped) or len(numbered) >= 4):
                    rebuilt.new_section(m.group(1).strip(), 1)
                    if m.group(2).strip():
                        rebuilt.add(m.group(2).strip())
                else:
                    rebuilt.add(p)
            alt = rebuilt.finish()
            if len(alt) > 1:
                sections = alt
    return normalize_levels(sections)


def normalize_levels(sections):
    """Shift levels down so the shallowest is 1 (h3-only pages, szLb books)."""
    if not sections:
        return sections
    min_level = min(s['level'] for s in sections)
    if min_level > 1:
        for s in sections:
            s['level'] -= min_level - 1
    return sections

# ---------------------------------------------------------------------- #
# legacy ICP walker                                                      #
# ---------------------------------------------------------------------- #

ICP_CONFIG = {
    '53ThRent.htm': dict(start=r'<a name="1">', bold_leads=True),
    'Elements.htm': dict(start=r'<a name="1971Presentation">'),
    'CL47.htm': dict(start=r'<a name="RevProg">', end=r'<a name="(?!RevProg)'),
    '83CommOrgCentral.htm': dict(start=None),
    '64MarxEc.htm': dict(start=None),
    '57DoctrinalWar.htm': dict(start=None),
    '70MainResultsBook1.htm': dict(start=None),
    '48Existentialism.htm': dict(start=None),
}

# Books where the live page is a faithful slice even though the old txt
# scrape swallowed more (CL47's scrape ingested the entire journal issue).
TRUST_NEW = {'CL47.htm'}


def filename_of(url):
    return url.rsplit('/', 1)[-1].split('#')[0]


def decode_html(raw):
    for enc in ('utf-8', 'cp1252'):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode('utf-8', 'replace')


def element_text(node):
    return clean_text(inline_md(node)).strip()


HEADING_CLASSES = {'szxlb', 'szxl', 'szlb', 'style3', 'szl', 'szli'}
LAYOUT_HEADING_CLASSES = {'szxlb', 'szxl', 'szl', 'szli'}


def is_layout_table(tbl):
    """1990s ICP pages wrap whole bodies in layout tables. A table that
    contains paragraphs or heading spans is a layout container, not data."""
    for cls_list in ('p',):
        if find(tbl, lambda n, t=cls_list: n.tag == t) is not None:
            return True
    if find(tbl, lambda n: n.tag == 'span' and n.classes & LAYOUT_HEADING_CLASSES) is not None:
        return True
    return False


def emit_heading_span(c, builder):
    """A heading-class span may carry several <br>-separated heading lines
    (Elements: 'Part I - …' + '1. The commodity')."""
    cls = {s.lower() for s in c.classes}
    text = element_text_with_breaks(c)
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
        if re.match(r'^part\s+[ivxlc]+\b', line, re.I):
            builder.new_section(line, 1)
        elif cls & {'szxl', 'szxlb', 'szli'}:
            builder.new_section(line, 1)
        elif 'szl' in cls and re.match(r'^\d{1,2}\.\s+\S', line):
            builder.new_section(line, 2)
        else:
            builder.new_section(line, 2)


FLATTEN_CONTAINERS = {'p', 'a', 'center', 'div', 'font', 'td', 'tr', 'tbody', 'thead'}


def flatten_block(node, out):
    """Depth-first flatten a paragraph's inline content, treating heading
    spans and tables as barriers (Elements' unclosed <a>s nest headings
    inside paragraphs)."""
    for ch in node.children:
        if isinstance(ch, str):
            out.append(('text', clean_text(ch)))
            continue
        ch_cls = {s.lower() for s in ch.classes}
        if ch.tag == 'span' and ch_cls & HEADING_CLASSES:
            out.append(('heading', ch))
        elif ch.tag == 'table':
            out.append(('table', ch))
        elif ch.tag == 'br':
            out.append(('text', '\n'))
        elif ch.tag in FLATTEN_CONTAINERS:
            flatten_block(ch, out)
        else:
            out.append(('text', inline_md(ch)))


def walk_legacy(node, builder, bold_leads, flow):
    """Walk the ICP tree: heading spans become sections, <p>s and loose
    text become paragraphs, tables become markdown tables."""
    for c in node.children:
        if isinstance(c, str):
            flow.append(clean_text(c))
            continue
        tag = c.tag
        cls = {s.lower() for s in c.classes}
        if tag == 'table':
            if is_layout_table(c):
                walk_legacy(c, builder, bold_leads, flow)
                continue
            flush_flow(flow, builder, bold_leads)
            md = table_md(c)
            if md:
                builder.add(md)
        elif tag == 'p':
            if find(c, lambda n: n.tag == 'span' and
                    {s.lower() for s in n.classes} & HEADING_CLASSES) is not None:
                # mixed block: heading spans nested in the paragraph
                flush_flow(flow, builder, bold_leads)
                flat = []
                flatten_block(c, flat)
                buf = []
                for kind, item in flat:
                    if kind == 'heading':
                        if buf:
                            text = re.sub(r'\s+', ' ', ''.join(buf)).strip()
                            if text:
                                builder.add(text)
                            buf = []
                        emit_heading_span(item, builder)
                    elif kind == 'table':
                        if buf:
                            text = re.sub(r'\s+', ' ', ''.join(buf)).strip()
                            if text:
                                builder.add(text)
                            buf = []
                        md = table_md(item)
                        if md:
                            builder.add(md)
                    else:
                        buf.append(item)
                if buf:
                    text = re.sub(r'\s+', ' ', ''.join(buf)).strip()
                    if text:
                        builder.add(text)
                continue
            flush_flow(flow, builder, bold_leads)
            md = para_md(c)
            md = re.sub(r'\s*\n\s*', ' ', md).strip()
            if not md or md == ' ':
                continue
            m = BOLD_LEAD.match(md) if bold_leads else None
            if m and len(m.group(1)) <= 90:
                builder.new_section(m.group(1).strip(), 2)
                if m.group(2).strip():
                    builder.add(m.group(2).strip())
            else:
                builder.add(md)
        elif tag == 'span':
            if cls & HEADING_CLASSES:
                flush_flow(flow, builder, bold_leads)
                emit_heading_span(c, builder)
            else:
                flow.append(element_text(c))
        elif tag == 'br':
            flow.append('\n')
        elif tag == 'hr':
            flush_flow(flow, builder, bold_leads)
        else:
            # containers (root wrappers, layout cells, inline tags) — recurse
            walk_legacy(c, builder, bold_leads, flow)


def element_text_with_breaks(node):
    """Text of a heading span, <br> kept as newline."""
    parts = []
    for c in node.children:
        if isinstance(c, str):
            parts.append(clean_text(c))
        elif c.tag == 'br':
            parts.append('\n')
        else:
            parts.append(element_text_with_breaks(c))
    return ''.join(parts)


def flush_flow(flow, builder, bold_leads):
    text = ''.join(flow)
    flow.clear()
    text = text.replace('\n', ' ')
    text = re.sub(r' {2,}', ' ', text).strip()
    if text:
        builder.add(text)


def extract_legacy(raw, url, title):
    filename = url.rsplit('/', 1)[-1].split('#')[0]
    cfg = ICP_CONFIG.get(filename, {})
    html_text = decode_html(raw)
    html_text = re.sub(r'&nbsp;?', ' ', html_text)
    html_text = re.sub(r'&shy;?', '', html_text)

    start = 0
    if cfg.get('start'):
        m = re.search(cfg['start'], html_text)
        if m:
            start = m.start()
    else:
        # default: body begins after the header layout table closes, marked
        # by the szXS source note followed by table closes
        m = re.search(r'class="szXS"', html_text)
        probe = m.start() if m else 0
        close = html_text.find('</table>', probe)
        start = close + 8 if close > 0 else 0

    end = len(html_text)
    if cfg.get('end'):
        m = re.search(cfg['end'], html_text[start + 10:])
        if m:
            end = start + 10 + m.start()

    # cut at the site footer if present
    foot = html_text.rfind('</body>')
    end = min(end, foot if foot > 0 else end)

    segment = html_text[start:end]
    tree = parse_tree(f'<root>{segment}</root>')
    builder = EditionBuilder()
    flow = []
    walk_legacy(tree, builder, cfg.get('bold_leads', False), flow)
    flush_flow(flow, builder, cfg.get('bold_leads', False))
    sections = builder.finish()
    sections = normalize_levels(sections)
    return sections if sections else None

# ---------------------------------------------------------------------- #
# pipeline                                                               #
# ---------------------------------------------------------------------- #

ANON_KEY = None
with open(os.path.join(os.path.dirname(HERE), '.env.local')) as fh:
    for line in fh:
        mm = re.match(r'^([A-Z_]+)=(.*)$', line.strip())
        if mm and mm.group(1) == 'SUPABASE_SERVICE_ROLE_KEY':
            SERVICE_KEY = mm.group(2)
        if mm and mm.group(1) == 'NEXT_PUBLIC_SUPABASE_ANON_KEY':
            ANON_KEY = mm.group(2)


def reading_minutes(sections):
    words = ' '.join(s['md'] for s in sections).split()
    return max(1, round(len(words) / 200))


# ---------------------------------------------------------------------- #
# fallback: clean the existing (txt-derived) edition in place            #
# ---------------------------------------------------------------------- #

def reflow(lines):
    s = ' '.join(lines)
    s = re.sub(r' +([.,;:!?)\]»”’…])', r'\1', s)
    s = re.sub(r'([(\[“‘]) +', r'\1', s)
    return re.sub(r' {2,}', ' ', s).strip()


LIST_LINE = re.compile(r'^([-*+]\s+|\d{1,3}[.)]\s+|>\s?|\\[-*+]|\\\d{1,3}[.)]\s)')


def clean_legacy_md(md):
    text = clean_text(md).replace('\t', ' ')
    text = '\n'.join(l for l in text.split('\n')
                     if not re.match(r'^source:\s*\S+', l.strip(), re.I))
    blocks = [b.strip() for b in re.split(r'\n{2,}', text) if b.strip()]
    out = []
    for block in blocks:
        lines = [l.strip() for l in block.split('\n') if l.strip()]
        if len(lines) > 1 and sum(1 for l in lines if LIST_LINE.match(l)) < 2:
            out.append(reflow(lines))
        else:
            out.append('\n'.join(lines))
    return '\n\n'.join(out).strip()


def clean_old_edition(te):
    """Source-stripping, reflowing cleanup of the stored txt edition —
    the fallback when the live page has less text than the scrape did."""
    sections = []
    for sec in te['sections']:
        md = clean_legacy_md(sec.get('md') or '')
        if sec.get('title') == 'Front matter':
            md = re.sub(r'(?m)^year:\s*\d{4}\s*$', '', md).strip()
        if md:
            sections.append({'id': sec['id'], 'title': sec.get('title') or '',
                             'level': sec.get('level') or 1, 'md': md})
    return sections


def fetch(url):
    os.makedirs(CACHE, exist_ok=True)
    key = os.path.join(CACHE, hashlib.md5(url.encode()).hexdigest()[:12] + '.html')
    if os.path.exists(key) and os.path.getsize(key) > 500:
        return open(key, 'rb').read()
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (edition-rebuild)'})
    data = urllib.request.urlopen(req, timeout=30).read()
    open(key, 'wb').write(data)
    time.sleep(0.25)
    return data


def api(path, method='GET', body=None, key=None):
    headers = {'apikey': key, 'Authorization': f'Bearer {key}'}
    data = None
    if body is not None:
        headers['Content-Type'] = 'application/json'
        data = json.dumps(body).encode()
    req = urllib.request.Request(SUPABASE_URL + path, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req) as r:
        payload = r.read()
    return json.loads(payload) if payload else None


def main():
    do_apply = '--apply' in sys.argv
    rows = api('/rest/v1/digital_library_books?select=id,title,text_edition'
               '&is_official=eq.true&text_edition=not.is.null&limit=200', key=ANON_KEY)
    print(f'{len(rows)} editions in library')

    # Re-runs: the stored front matters no longer carry the "Source:" lines
    # (this script removed them), so originals — including source URLs and
    # pre-cleanup word counts — come from the backup taken before the first
    # apply.
    if os.path.exists(BACKUP):
        with open(BACKUP) as fh:
            backup_rows = json.load(fh)
        if any(re.search(r'(?m)^Source:\s*\S+', r['text_edition']['sections'][0].get('md', ''))
               for r in backup_rows):
            rows = backup_rows
            print(f'Using pre-cleanup originals from {BACKUP}')
    else:
        with open(BACKUP, 'w') as fh:
            json.dump(rows, fh, indent=1)
        print(f'Backup of originals: {BACKUP}')

    # source urls live in the front matter Source lines
    rebuilt = []
    for row in rows:
        te = row['text_edition']
        fm = te['sections'][0]
        m = re.search(r'(?m)^Source:\s*(\S+)', fm.get('md', ''))
        if not m:
            print(f'! no source url for {row["title"]}')
            continue
        url = m.group(1)
        raw = fetch(url)
        if 'communist-left.org' in url:
            sections = extract_modern(decode_html(raw), row['title'])
        else:
            sections = extract_legacy(raw, url, row['title'])
        if not sections:
            print(f'! parse produced nothing for {row["title"]}')
            continue
        old_words = len(' '.join(s['md'] for s in te['sections']).split())
        new_words = len(' '.join(s['md'] for s in sections).split())
        ratio = new_words / max(1, old_words)
        used_fallback = False
        if ratio < 0.8 and filename_of(url) not in TRUST_NEW:
            # The live page carries less text than the original scrape —
            # keep the fuller stored text, but cleaned.
            sections = clean_old_edition(te)
            new_words = len(' '.join(s['md'] for s in sections).split())
            used_fallback = True
        flag = '' if new_words / max(1, old_words) >= 0.75 else '  ⚠️ WORD-RATIO'
        note = ' [cleaned-old]' if used_fallback else ''
        rebuilt.append({
            'id': row['id'], 'title': row['title'], 'sections': sections,
            'reading_minutes': reading_minutes(sections),
            'source': 'txt' if used_fallback else 'html',
            'generated_at': '2026-10-05T00:00:00.000Z',
        })
        l1 = sum(1 for s in sections if s['level'] == 1)
        l2 = sum(1 for s in sections if s['level'] == 2)
        print(f'· {row["title"]}\n    sections {len(te["sections"])} → {len(sections)}'
              f' (L1 {l1} / L2 {l2}) · words {old_words} → {new_words}{note}{flag}')

    # sanity
    for rb in rebuilt:
        ids = [s['id'] for s in rb['sections']]
        assert len(set(ids)) == len(ids), rb['title']
        for s in rb['sections']:
            assert not re.search(r'(?m)^source:', s['md'], re.I), (rb['title'], s['id'])
            assert s['md'].strip() or s['title'].strip(), (rb['title'], s['id'])
    print(f'\nSanity OK for {len(rebuilt)}/{len(rows)} books.')

    snapshot = os.path.join(HERE, '.text-edition-rebuilt-2026-10-05.json')
    with open(snapshot, 'w') as fh:
        json.dump(rebuilt, fh, indent=1)
    print(f'Snapshot: {snapshot}')

    if not do_apply:
        print('Dry run only — pass --apply to PATCH Supabase.')
        return

    ok = fail = 0
    for rb in rebuilt:
        try:
            api(f'/rest/v1/digital_library_books?id=eq.{rb["id"]}', method='PATCH',
                body={'text_edition': {k: rb[k] for k in ('sections', 'reading_minutes', 'source', 'generated_at')}},
                key=SERVICE_KEY)
            ok += 1
        except Exception as e:
            fail += 1
            print(f'! {rb["title"]}: {e}')
    print(f'\nApplied: {ok} updated, {fail} failed.')


if __name__ == '__main__':
    main()
