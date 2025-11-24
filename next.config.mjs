/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  pageExtensions: ['ts', 'tsx'],
  experimental: {
    esmExternals: true,
  },
};

export default nextConfig;
