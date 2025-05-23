/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['*'], // Allow images from all domains for favicons
  },
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:5000/api',
  },
};

module.exports = nextConfig;