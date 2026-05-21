/** @type {import('next').NextConfig} */

const biddingServiceUrl = process.env.BIDDING_SERVICE_URL || 'http://bidding-service:8082';
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:8086';

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
        destination: `${notificationServiceUrl}/api/notifications/ws/notifications/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;