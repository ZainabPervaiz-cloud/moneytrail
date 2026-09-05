import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Tailwind v4 works as a Vite plugin directly — no tailwind.config.js
    // or postcss.config.js needed; styling is pulled in via `@import
    // "tailwindcss"` in src/index.css instead.
    tailwindcss(),
    // Generates the web app manifest + service worker that let a phone
    // browser offer "Add to Home Screen" and let the app run offline.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Finance Tracker',
        short_name: 'FinTrack',
        description: 'Track income, expenses, and budgets on the go.',
        theme_color: '#0f766e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      // Precaches the built assets so the app keeps working with no
      // network connection after the first visit.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  server: {
    // Lets the frontend dev server be reached from a phone on the same
    // Wi-Fi network (useful for testing the "install to home screen"
    // flow on an actual device), not just localhost.
    host: true,
  },
})
