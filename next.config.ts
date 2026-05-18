/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',

  async rewrites() {
    return [
      {
        source: '/api/bidding/ws-auction/:path*',
        destination: `${process.env.BIDDING_SERVICE_URL}/ws-auction/:path*`,
      },
      {
        source: '/api/notifications/ws/notifications/:path*',
        destination: `${process.env.NOTIFICATION_SERVICE_URL}/ws/notifications/:path*`,
      },
    ];
  },
};

export default nextConfig;