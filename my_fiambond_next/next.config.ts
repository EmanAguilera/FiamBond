import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* * ⭐️ Required for Firebase Hosting: 
   * This generates the static 'out' directory.
   */
  output: 'export',

  /* * ⭐️ Prevents "Unexpected token <":
   * Ensures that routes like /login are exported as /login/index.html.
   * This matches the way Firebase Hosting looks for static files.
   */
  trailingSlash: true,

  /* * ⭐️ Image Optimization:
   * Standard Next.js Image optimization requires a Node.js server.
   * Since Firebase Hosting is static, we must disable it.
   */
  images: {
    unoptimized: true,
  },

  /*
   * ⭐️ Optional: Build Directory
   * Explicitly naming the output folder 'out' (standard for static exports)
   */
  distDir: 'out',
};

export default nextConfig;