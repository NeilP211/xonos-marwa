import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served as a GitHub Pages project site at https://neilp211.github.io/xonos-marwa/
export default defineConfig({
  base: '/xonos-marwa/',
  plugins: [react()],
})
