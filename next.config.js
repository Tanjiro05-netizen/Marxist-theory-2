const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin');

const withVanillaExtract = createVanillaExtractPlugin({
  identifiers: process.env.NODE_ENV === 'development' ? 'debug' : 'short',
});

const securityHeaders = [
  { key: 'Content-Security-Policy', value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'" },
  {
    key: 'Content-Security-Policy-Report-Only',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-src https://challenges.cloudflare.com",
      "worker-src 'self' blob:",
    ].join('; '),
  },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep the live development compiler isolated from production builds.
  // Otherwise `next build` can replace assets that an active dev server is serving.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'substack-post-media.s3.amazonaws.com',
        pathname: '/public/images/**',
      },
      {
        protocol: 'https',
        hostname: '*.substackcdn.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/service-worker.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        // Static map geometry — effectively immutable, cache hard
        source: '/topo/:file*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  webpack: (config, { dev, webpack }) => {
    // pdfjs-dist (Node entry) requires the native 'canvas' package, which is
    // not installed and is only used for server-side canvas rendering we never
    // do — resolve it to an empty module so both bundles compile.
    config.resolve.alias = { ...config.resolve.alias, canvas: false };

    if (!dev) {
      config.cache = false;

      // Member-facing sections that are intentionally hidden in production.
      // Their page files are swapped with a dummy component that redirects to /coming-soon.
      const blockedFolders = [
        'theory',
        'analysis',
        'politics',
        ...(process.env.SUBMISSIONS_ENABLED === 'true' ? [] : ['submit']),
        'article',
        'profile',
        'directory',
        'glossary',
        'study',
        'science-tech',
        'visualizations',
        'forum',
        'knowledge',
      ];

      // Route groups like src/app/(app)/theory/page.jsx must still match:
      // allow an optional group segment after app/. Parens are matched via
      // character classes to avoid backslash-escaping pitfalls.
      const blockedPattern = new RegExp(
        `src[\\\\/]app[\\\\/](?:[(][^)]+[)][\\\\/])?(?:${blockedFolders.join('|')})[\\\\/].*page\\.(jsx|js)$`
      );

      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          blockedPattern,
          require.resolve('./src/components/DummyComingSoon.jsx')
        )
      );
    }

    return config;
  },
};

module.exports = withVanillaExtract(nextConfig);
