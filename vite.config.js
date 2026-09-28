import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `base: './'` keeps the build working when served from a sub-path
// (e.g. GitHub Pages at /<repo-name>/).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
})
