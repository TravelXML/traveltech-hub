import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base so the same build works whether served from a domain root
  // (Netlify, Vercel, Surge) or a subpath (GitHub Pages project sites).
  base: './',
})
