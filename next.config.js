const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin');

const withVanillaExtract = createVanillaExtractPlugin({
  identifiers: process.env.NODE_ENV === 'development' ? 'debug' : 'short',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
        source: '/service-worker.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
  webpack: (config, { dev, webpack }) => {
    if (!dev) {
      config.cache = false;

      // Member-facing sections that are intentionally hidden in production.
      // Their page files are swapped with a dummy component that redirects to /coming-soon.
      const blockedFolders = [
        'theory',
        'analysis',
        'politics',
        'submit',
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

      const blockedPattern = new RegExp(
        `src[\\\\/]app[\\\\/](${blockedFolders.join('|')})[\\\\/].*page\\.(jsx|js)$`
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
