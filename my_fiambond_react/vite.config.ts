import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Add this hmr block
    hmr: {
      host: 'localhost',
    },
    proxy:{
      '/api':{
        target: 'http://127.0.0.1:8000',
        changeOrigin:true,
        headers:{
          Accept: 'application/json',
          "Content-Type": 'application/json',
          "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
          "Cross-Origin-Embedder-Policy": "require-corp",
        }
      }
    }
  }
})