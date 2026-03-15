import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "api-staging.cliniqa.cloud" },
      { protocol: "https", hostname: "api.cliniqa.cloud" },
    ],
  },
};

export default nextConfig;
