import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 👇 This tells Next.js/Vercel: "even if TS has errors, still build"
  typescript: {
    ignoreBuildErrors: true,
  },

  // (optional) also ignore ESLint errors during build:
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
};

export default nextConfig;
