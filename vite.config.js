import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  // Use '/' for Vercel, '/report-maker/' for GitHub Pages
  const base = process.env.VERCEL ? '/' : (command === 'build' ? '/report-maker/' : '/')

  return {
    plugins: [react()],
    base: base,
  }
})
