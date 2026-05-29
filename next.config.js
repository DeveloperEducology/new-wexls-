const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-6d655d3564544704a2d99beb0760355e.r2.dev',
        pathname: '/images/**',
      },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname),
    resolveAlias: {
      'fs': { browser: './src/lib/empty.js' },
      'path': { browser: './src/lib/empty.js' },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  }
};

module.exports = nextConfig;
