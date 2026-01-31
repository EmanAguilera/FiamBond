import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* REMOVED: output: 'export' 
     Vercel works best with the default build. This allows us to use 
     custom headers to fix your Firebase popup errors.
  */

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups', 
          },
        ],
      },
    ];
  },

  // Ensures your images (like Cloudinary) work correctly
  images: {
    unoptimized: true, 
  },
};

export default nextConfig;