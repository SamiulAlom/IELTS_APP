import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  distDir: process.env.PERSISTENCE_TEST === "1" ? ".runtime/next-persistence" : ".next",
};
export default nextConfig;
