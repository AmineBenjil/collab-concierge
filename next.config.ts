import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  /* no floating "N" over the demo; compile and runtime errors still show */
  devIndicators: false,
  partialPrefetching: true,
  /* the business's request list moved from /dashboard to /requests; old links still land */
  async redirects() {
    return [{ source: "/dashboard", destination: "/requests", permanent: true }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
