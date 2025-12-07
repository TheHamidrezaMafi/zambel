import nextPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
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
        protocol: 'https',
        hostname: 'api.zambeel.ir',
        port: '',
        pathname: '/assets/**',
      },
    ],
  },
};

const withPWA = nextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

export default withPWA(nextConfig);
