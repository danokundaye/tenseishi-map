import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        sector0: resolve(__dirname, 'pages/sector-zero.html'),
        sector1: resolve(__dirname, 'pages/sector-one.html'),
        sector2: resolve(__dirname, 'pages/sector-two.html'),
        sector3: resolve(__dirname, 'pages/sector-three.html'),
      },
    },
  },
})
