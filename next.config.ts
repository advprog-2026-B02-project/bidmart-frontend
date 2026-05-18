/** @type {import('next').NextConfig} */

const biddingServiceUrl = process.env.BIDDING_SERVICE_URL || 'http://localhost:8080';
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8082';

const nextConfig = {
  output: 'standalone',

  async rewrites() {
    return [
      {
        source: '/api/bidding/ws-auction/:path*',
        destination: `${biddingServiceUrl}/ws-auction/:path*`,
      },
      {
        source: '/api/notifications/ws/notifications/:path*',
        destination: `${notificationServiceUrl}/ws/notifications/:path*`,
      },
    ];
  },
};

export default nextConfig;
