import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ⭐️ KEEP THIS: Required for your Firebase Hosting deployment
  output: 'export', 

  // ⭐️ ADD THIS: Prevents the "Unexpected token <" error by ensuring 
  // the app knows where to find the static files
  trailingSlash: true,

  images: {
    unoptimized: true, 
  },
};

export default nextConfig;