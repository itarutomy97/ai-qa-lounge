import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning only, do not break build
    ignoreDuringBuilds: false,
  },
  images: {
    // Allow external YouTube thumbnails
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
};

export default nextConfig;
