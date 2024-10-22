/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add any other configuration options here
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["statistik.d-u-v.org"],
  },
};

export default nextConfig;
