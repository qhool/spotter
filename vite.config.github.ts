import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages specific configuration
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for GitHub Pages compatibility
  build: {
    outDir: 'exports/github',
    emptyOutDir: true,
    sourcemap: false, // Disable sourcemaps for production
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          spotify: ['@spotify/web-api-ts-sdk'],
        }
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
  },
})