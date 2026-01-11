/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Base path for /admin routing
  basePath: '/admin',
  // Allow images from any domain for scraped articles
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // CORS headers are handled by middleware.ts
  async headers() {
    return [];
  },
}

module.exports = nextConfig

