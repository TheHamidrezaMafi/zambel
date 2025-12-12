import nextPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable SWC minification to avoid binary compatibility issues in Docker
  swcMinify: false,
  eslint: {
    // Disable ESLint during production builds to avoid config issues
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Optionally, also ignore TypeScript errors during build if needed
    // ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.alibaba.ir',
        port: '',
        pathname: '/static/img/airlines/Domestic/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/assets/**',
      },
      {
        protocol: 'http',
        hostname: 'zambeel-backend-container',
        port: '8080',
        pathname: '/assets/**',
      },
      {
        protocol: 'https',
        hostname: 'api.zambeel.ir',
        port: '',
        pathname: '/assets/**',
      },
    ],
    // Disable image optimization to avoid fetch errors
    unoptimized: true,
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://zambeel-backend-container:8080';
    return [
      {
        source: '/assets/:path*',
        destination: `${backendUrl}/assets/:path*`,
      },
    ];
  },
};

const withPWA = nextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

export default withPWA(nextConfig);
