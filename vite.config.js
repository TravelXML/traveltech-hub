import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // '/' for Cloudflare Pages (the default - just run `npm run build`). Set
  // VITE_BASE_PATH=/traveltech-hub/ when building for the GitHub Pages
  // project site instead (see .github/workflows/deploy.yml and the
  // `deploy` npm script), since that's served from a subpath.
  base: process.env.VITE_BASE_PATH || '/',
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
  },
})
