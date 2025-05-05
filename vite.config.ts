import { defineConfig } from 'vite'

export default defineConfig({
  base: './',  // This makes all asset paths relative
  build: {
    outDir: 'docs',
    assetsDir: 'assets'
  }
}) 