/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@meoluna/database', '@meoluna/ui'],
  images: {
    domains: ['images.unsplash.com', 'cdn.meoluna.com'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

module.exports = nextConfig