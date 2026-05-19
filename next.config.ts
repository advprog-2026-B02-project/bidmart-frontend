/** @type {import('next').NextConfig} */

const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8081';
const biddingServiceUrl = process.env.BIDDING_SERVICE_URL || 'http://localhost:8082';
const catalogServiceUrl = process.env.CATALOG_SERVICE_URL || 'http://localhost:8083';
const walletServiceUrl = process.env.WALLET_SERVICE_URL || 'http://localhost:8084';
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8086';
const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://localhost:8085';

const nextConfig = {
  output: 'standalone',

  async rewrites() {
    return [
      { source: '/api/catalog', destination: `${catalogServiceUrl}/catalog` },
      { source: '/api/listings/:path*', destination: `${catalogServiceUrl}/listings/:path*` },
      { source: '/api/seller/:path*', destination: `${catalogServiceUrl}/seller/:path*` },
      { source: '/api/admin/categories/:path*', destination: `${catalogServiceUrl}/admin/categories/:path*` },

      { source: '/api/auctions/:path*', destination: `${biddingServiceUrl}/auctions/:path*` },
      { source: '/api/bidding/ws-auction/:path*', destination: `${biddingServiceUrl}/ws-auction/:path*` },

      { source: '/api/v1/notifications/:path*', destination: `${notificationServiceUrl}/api/v1/notifications/:path*` },
      { source: '/api/notifications/ws/notifications/:path*', destination: `${notificationServiceUrl}/ws/notifications/:path*` },

      { source: '/api/v1/orders/:path*', destination: `${orderServiceUrl}/api/v1/orders/:path*` },
      { source: '/api/admin/v1/orders/:path*', destination: `${orderServiceUrl}/admin/v1/orders/:path*` },

      { source: '/api/users/:path*', destination: `${authServiceUrl}/users/:path*` },
      { source: '/api/me', destination: `${authServiceUrl}/me` },
      { source: '/api/admin/users/:path*', destination: `${authServiceUrl}/admin/users/:path*` },
      { source: '/api/admin/roles/:path*', destination: `${authServiceUrl}/admin/roles/:path*` },
    ];
  },
};

export default nextConfig;