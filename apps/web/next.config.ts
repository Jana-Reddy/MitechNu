import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@academy/ai", "@academy/config", "@academy/db", "@academy/media", "@academy/ui"],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "127.0.0.1:53425"]
    }
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.qrserver.com" }
    ]
  }
};

export default nextConfig;

