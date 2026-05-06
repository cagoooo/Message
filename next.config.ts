import type { NextConfig } from "next";

// GitHub Pages 部署在 https://cagoooo.github.io/Message/，需要 basePath
// 本機開發 (npm run dev) 不要 basePath 才能用 http://localhost:9002
const isProd = process.env.NODE_ENV === "production";
const repo = "Message";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
  trailingSlash: true,

  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co", port: "", pathname: "/**" },
    ],
  },
};

export default nextConfig;
