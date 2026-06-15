/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Target older browsers including iOS 15 (iPhone 7)
  experimental: {
    legacyBrowsers: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
