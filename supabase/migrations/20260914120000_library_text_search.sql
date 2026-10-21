-- Full-text search for the digital library.
--
-- Unnests digital_library_books.text_edition.sections into a flat index
-- table with a trigram-indexed normalized column, kept in sync by a trigger
-- whenever text_edition changes. The public RPC search_library_text() does
-- exact-phrase matching (Ctrl+F semantics: quote/dash/case variants are
-- forgiven by normalization) with an all-words fallback, returning
-- per-section snippets plus match offsets so the client can <mark> the hit.
--
-- Unicode codepoints in patterns use U&'...' escape literals so the source
-- stays ASCII and verifiable.

create extension if not exists pg_trgm;

-- ── Normalization helpers (private schema: not callable API surface) ──

-- Turn a markdown section body into matchable prose: strip markdown syntax
-- that would break mid-sentence substring matches (emphasis, links, heading
-- and list markers, HTML tags, table pipes), map typographic punctuation to
-- ASCII, and collapse all whitespace to single spaces. Casing is preserved
-- so snippets read naturally; matching runs against lower(text) instead.
create or replace function private.library_normalize_text(raw text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select nullif(
    btrim(
      regexp_replace(                                             -- 15. collapse whitespace
        regexp_replace(                                           -- 14. exotic spaces -> plain
          regexp_replace(                                         -- 13. table pipes -> space
            translate(                                            -- 12. quotes/dashes -> ASCII
              regexp_replace(                                     -- 11. ellipsis -> ...
                regexp_replace(                                   -- 10. emphasis / code markers
                  regexp_replace(                                 -- 9. footnote refs
                    regexp_replace(                               -- 8. reference links -> label
                      regexp_replace(                             -- 7. inline links -> label
                        regexp_replace(                           -- 6. images
                          regexp_replace(                         -- 5. list markers
                            regexp_replace(                       -- 4. blockquote markers
                              regexp_replace(                     -- 3. heading markers
                                regexp_replace(                   -- 2. horizontal rules
                                  regexp_replace(                 -- 1. HTML tags
                                    raw, '<[^>]*>', ' ', 'g'),
                                  '^[[:space:]]*([-*_]+[[:space:]]*){3,}$', ' ', 'gn'),
                                '^[[:space:]]{0,3}#{1,6}[[:space:]]+', '', 'gn'),
                              '^[[:space:]]*>+ ?', '', 'gn'),
                            '^[[:space:]]*([-*+]|[[:digit:]]{1,3}\.)[[:space:]]+', '', 'gn'),
                          '!\[[^\]]*\]\([^)]*\)', ' ', 'g'),
                        '\[([^\]]*)\]\([^)]*\)', '\1', 'g'),
                      '\[([^\]]*)\]\[[^\]]*\]', '\1', 'g'),
                    '\[\^[^\]]*\]', '', 'g'),
                  '[*_~`]+', '', 'g'),
                U&'\2026', '...', 'g'),
              U&'\2018\2019\201A\2039\203A\201C\201D\201E\00AB\00BB\2010\2011\2012\2013\2014\2015',
              U&'\0027\0027\0027\0027\0027\0022\0022\0022\0022\0022\002D\002D\002D\002D\002D\002D'),
            '\|', ' ', 'g'),
          U&'[\00A0\2007\2009\200A\202F\200B\FEFF]', ' ', 'g'),
        '[[:space:]]+', ' ', 'g')
    ),
    '')
$$;

-- Escape LIKE wildcards so user input stays a literal substring.
create or replace function private.library_escape_like(s text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select replace(replace(replace(coalesce(s, ''), '\', '\\'), '%', '\%'), '_', '\_')
$$;

-- ── Index table: one row per text_edition section ──

create table if not exists public.digital_library_book_sections (
    id bigint generated always as identity primary key,
    book_id uuid not null references public.digital_library_books (id) on delete cascade,
    section_id text not null,
    section_title text,
    text text not null default '',
    search_lower text generated always as (lower(text)) stored,
    unique (book_id, section_id)
);

alter table public.digital_library_book_sections owner to postgres;

-- ── Sync trigger: rebuild a book's rows whenever its text_edition changes ──

create or replace function public.sync_digital_library_book_sections()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.digital_library_book_sections where book_id = new.id;

  if new.text_edition is not null
     and jsonb_typeof(new.text_edition -> 'sections') = 'array' then
    insert into public.digital_library_book_sections (book_id, section_id, section_title, text)
    select new.id,
           coalesce(sec ->> 'id', 's' || (ord - 1)::text),
           sec ->> 'title',
           private.library_normalize_text(concat_ws(E'\n', sec ->> 'title', sec ->> 'md'))
    from jsonb_array_elements(new.text_edition -> 'sections') with ordinality as t (sec, ord)
    where jsonb_typeof(sec) = 'object';
  end if;

  return null;
end;
$$;

-- ── Backfill existing books ──

insert into public.digital_library_book_sections (book_id, section_id, section_title, text)
select b.id,
       coalesce(sec ->> 'id', 's' || (ord - 1)::text),
       sec ->> 'title',
       private.library_normalize_text(concat_ws(E'\n', sec ->> 'title', sec ->> 'md'))
from public.digital_library_books b
cross join lateral jsonb_array_elements(coalesce(b.text_edition -> 'sections', '[]'::jsonb))
  with ordinality as t (sec, ord)
where b.text_edition is not null
  and jsonb_typeof(b.text_edition -> 'sections') = 'array'
  and jsonb_typeof(sec) = 'object'
on conflict (book_id, section_id) do update
  set section_title = excluded.section_title,
      text = excluded.text;

create trigger trg_digital_library_books_sections_ins
  after insert on public.digital_library_books
  for each row
  execute function public.sync_digital_library_book_sections();

create trigger trg_digital_library_books_sections_upd
  after update of text_edition on public.digital_library_books
  for each row
  when (new.text_edition is distinct from old.text_edition)
  execute function public.sync_digital_library_book_sections();

-- ── Indexes (after backfill so they build in one pass) ──

create index if not exists idx_dl_book_sections_trgm
  on public.digital_library_book_sections using gin (search_lower gin_trgm_ops);

create index if not exists idx_dl_book_sections_book
  on public.digital_library_book_sections (book_id);

-- ── Access: public read, no client writes ──

alter table public.digital_library_book_sections enable row level security;

create policy "Anyone can read book sections"
  on public.digital_library_book_sections
  for select
  using (true);

revoke insert, update, delete on public.digital_library_book_sections from anon, authenticated;
-- Explicit read grant: do not rely on platform default privileges.
grant select on public.digital_library_book_sections to anon, authenticated;

-- ── Public search RPC ──
--
-- p_mode: 'auto' (exact phrase first, then sections containing every word in
--         any order) or anything else for exact-phrase-only.
-- Returns per-section rows: book metadata + ~260-char snippet around the
-- first match with match_offset (0-based into snippet) and match_len so the
-- client can wrap the exact range in a highlight without re-searching.

create or replace function public.search_library_text(
  p_query text,
  p_mode text default 'auto',
  p_limit_per_book int default 3,
  p_max_books int default 20
)
returns table (
  book_id uuid,
  title text,
  author text,
  year int,
  category text,
  era text,
  language text,
  cover_image_url text,
  section_id text,
  section_title text,
  snippet text,
  match_offset int,
  match_len int,
  snippet_cut_start boolean,
  snippet_cut_end boolean,
  is_exact boolean,
  book_match_count bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_query text := lower(private.library_normalize_text(left(coalesce(p_query, ''), 300)));
  v_pattern text;
  v_tokens text[];
  v_limit_per_book int := least(greatest(coalesce(p_limit_per_book, 3), 1), 10);
  v_max_books int := least(greatest(coalesce(p_max_books, 20), 1), 50);
begin
  -- Trigram matching needs at least 3 characters to be meaningful.
  if length(v_query) < 3 then
    return;
  end if;

  v_pattern := '%' || private.library_escape_like(v_query) || '%';

  select array_agg(distinct tok) into v_tokens
  from unnest(string_to_array(v_query, ' ')) as tok
  where length(btrim(tok)) > 0;

  return query
  with exact_hits as (
    select s.book_id, s.section_id, s.section_title, s.text,
           position(v_query in s.search_lower) as pos,
           length(v_query) as match_len,
           true as is_exact
    from public.digital_library_book_sections s
    where s.search_lower like v_pattern escape '\'
  ),
  word_hits as (
    select s.book_id, s.section_id, s.section_title, s.text,
           f.pos as pos,
           f.match_len as match_len,
           false as is_exact
    from public.digital_library_book_sections s
    cross join lateral (
      select position(t.tok in s.search_lower) as pos, length(t.tok) as match_len
      from unnest(v_tokens) as t (tok)
      order by position(t.tok in s.search_lower) asc
      limit 1
    ) as f
    where p_mode = 'auto'
      and v_tokens is not null
      and cardinality(v_tokens) > 1
      and s.search_lower not like v_pattern escape '\'
      and not exists (
        select 1 from unnest(v_tokens) as t (tok)
        where position(t.tok in s.search_lower) = 0
      )
  ),
  hits as (
    select * from exact_hits
    union all
    select * from word_hits
  ),
  ranked as (
    select h.*,
           count(*) over (partition by h.book_id) as book_match_count,
           bool_or(h.is_exact) over (partition by h.book_id) as book_has_exact,
           row_number() over (partition by h.book_id order by h.is_exact desc, h.pos, h.section_id) as rn_book
    from hits h
  ),
  book_ranked as (
    select r.*,
           dense_rank() over (order by r.book_has_exact desc, r.book_match_count desc, r.book_id) as book_rank
    from ranked r
  ),
  windowed as (
    select br.*,
           greatest(br.pos - 110, 1) as snippet_start,
           least(260, greatest(length(br.text) - greatest(br.pos - 110, 1) + 1, 12)) as snippet_len
    from book_ranked br
  )
  select b.id, b.title, b.author, b.year, b.category, b.era, b.language, b.cover_image_url,
         w.section_id, w.section_title,
         substring(w.text from w.snippet_start for w.snippet_len) as snippet,
         (w.pos - w.snippet_start)::int as match_offset,
         w.match_len::int as match_len,
         (w.snippet_start > 1) as snippet_cut_start,
         (w.snippet_start + w.snippet_len - 1 < length(w.text)) as snippet_cut_end,
         w.is_exact,
         w.book_match_count
  from windowed w
  join public.digital_library_books b on b.id = w.book_id
  where w.rn_book <= v_limit_per_book
    and w.book_rank <= v_max_books
  order by w.book_rank, w.is_exact desc, w.pos, w.section_id;
end;
$$;

revoke execute on function public.search_library_text(text, text, int, int) from public;
grant execute on function public.search_library_text(text, text, int, int) to anon, authenticated;
