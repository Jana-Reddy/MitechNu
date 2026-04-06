import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@academy/ai", "@academy/config", "@academy/db", "@academy/media", "@academy/ui"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  }
};

export default nextConfig;

