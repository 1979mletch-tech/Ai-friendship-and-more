import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves this repository below /Ai-friendship-and-more/.
// Vite needs the matching base so production asset URLs do not point at the domain root.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/Ai-friendship-and-more/' : '/',
  plugins: [react()],
})
