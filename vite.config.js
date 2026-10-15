import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `base: './'` keeps the build working when served from a sub-path
// (e.g. GitHub Pages at /<repo-name>/).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // PORT lets the dev launcher assign a free port when 5173 is taken.
  server: { port: Number(process.env.PORT) || 5173 },
})
