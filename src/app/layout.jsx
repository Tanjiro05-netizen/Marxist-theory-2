import '@/src/index.css';
import '@/src/styles/theme.css';
import { Cormorant_Garamond, Outfit, JetBrains_Mono } from 'next/font/google';
import Providers from './providers.jsx';

/* Self-hosted, preloaded fonts (same families/weights the theme expects).
   Replaces the post-hydration Google CDN link — no render-blocking fetch,
   no FOUT on navigation. Variables are consumed via --ff-* in theme.css.
   Newsreader has an optical-size axis next/font can't handle, so it loads
   via a server-rendered stylesheet link below (still static, not runtime). */
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-cormorant',
  display: 'swap',
});
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-outfit',
  display: 'swap',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const NEWSREADER_HREF =
  'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..700;1,6..72,200..600&display=swap';


/* Open the TLS connection to Supabase while HTML streams, so the first
   data query after hydration doesn't pay the handshake. */
const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host;
  } catch {
    return null;
  }
})();


const description =
  'An independent collective dedicated to the critique of political economy and the renaissance of genuine Marxist analysis.';

export const metadata = {
  metadataBase: new URL('https://www.marxist.info'),
  title: 'The Marxist Research Collective',
  description,
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.marxist.info/',
    title: 'The Marxist Research Collective',
    description,
    images: ['https://www.marxist.info/marx.png'],
  },
  twitter: {
    card: 'summary_large_image',
    url: 'https://www.marxist.info/',
    title: 'The Marxist Research Collective',
    description,
    images: ['https://www.marxist.info/marx.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#10131b',
};

export default function RootLayout({ children }) {
  // Auth state is resolved client-side by AuthContext via supabase.auth.onAuthStateChange.
  // Fetching it server-side on every request (force-dynamic) caused a full Supabase round-trip
  // on every page navigation — making the site feel very slow.
  const initialAuth = { user: null, profile: null, resolved: false };

  return (
    <html lang="en" className={`${cormorant.variable} ${outfit.variable} ${jetbrains.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={NEWSREADER_HREF} />
        {SUPABASE_HOST && (
          <>
            <link rel="preconnect" href={`https://${SUPABASE_HOST}`} />
            <link rel="dns-prefetch" href={`https://${SUPABASE_HOST}`} />
          </>
        )}
      </head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <Providers initialAuth={initialAuth}>{children}</Providers>
      </body>
    </html>
  );
}
