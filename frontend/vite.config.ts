import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
  server: {
    proxy: {
      '/api': {
        target: env.VITE_API_PROXY_URL,
        changeOrigin: true,
      }
    }
  },
  plugins: [
    tailwindcss(), 
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        clientsClaim: true,
        skipWaiting: true
      },
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Evenly',
        short_name: 'Evenly',
        description: 'A private running tab for a small group - split costs, see who owes who, settle up.',
        theme_color: '#1C2723',
        background_color: '#1C2723',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
  }
})
