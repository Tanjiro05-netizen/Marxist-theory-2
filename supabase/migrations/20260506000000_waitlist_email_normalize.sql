-- Normalize waitlist emails so duplicates can't slip in via case or whitespace.
-- Drop conflicts (keep oldest row per normalized email), normalize the column,
-- then add a case-insensitive unique index as defense-in-depth.

DELETE FROM public.waitlist w
USING public.waitlist w2
WHERE lower(btrim(w.email)) = lower(btrim(w2.email))
  AND (w.created_at, w.id) > (w2.created_at, w2.id);

UPDATE public.waitlist
SET email = lower(btrim(email))
WHERE email <> lower(btrim(email));

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_lower_idx
    ON public.waitlist (lower(email));
