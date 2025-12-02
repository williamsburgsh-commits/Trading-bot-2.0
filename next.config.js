/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  // Enable static exports for Vercel
  output: 'export',
  // Add base path if your app is not served from the root
  // basePath: '/your-base-path',
  // Enable image optimization
  images: {
    unoptimized: true, // Required for static exports
  },
  // Handle page transitions and static generation
  trailingSlash: true,
  // Environment variables
  env: {
    // Add any environment variables that should be available at build time
  },
};

module.exports = nextConfig;
