# Local submission scanner

This is the zero-subscription scanner for anonymous PDF submissions. Files stay
in the private Supabase `manuscripts` bucket until this Mac is available.

The worker performs these steps without opening the original document:

1. Verify the stored size, SHA-256 digest, PDF header, and PDF end marker.
2. Scan the original with ClamAV.
3. Validate the PDF object structure with qpdf.
4. Rewrite it with Ghostscript in safer mode, dropping annotations and active content.
5. Validate and scan the rewritten PDF again.
6. Upload only the rewritten copy to `safe/` and unlock it for admin review.

Install the local tools once:

```bash
brew install clamav qpdf ghostscript
```

Verify the installation and private Supabase connection:

```bash
npm run scanner:check
```

Verify clean-PDF processing and malware detection with the harmless EICAR test
signature:

```bash
npm run scanner:self-test
```

Process the current queue once:

```bash
npm run scanner:once
```

Or leave the worker running:

```bash
npm run scanner:watch
```

The worker reads `.env.local`. `SUPABASE_SERVICE_ROLE_KEY` must never be placed
in a `NEXT_PUBLIC_` variable or committed to Git. When the worker is stopped,
new submissions remain quarantined and cannot be viewed or approved.
