/** @type {import('next').NextConfig} */
const path = require("path");

const tailwindPath = path.resolve(__dirname, "node_modules/tailwindcss");

const nextConfig = {
  reactStrictMode: false,
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  turbopack: {
    resolveAlias: {
      tailwindcss: tailwindPath,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      tailwindcss: tailwindPath,
    };
    return config;
  },
};

module.exports = nextConfig;
