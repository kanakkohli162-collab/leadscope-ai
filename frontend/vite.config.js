import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],

  resolve: {
    // `@/` = `src/` → imports like '@/components/ui/StatCard' instead of '../../../components/ui/StatCard'
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 3000,
    open: true,
    // Dev proxy: any request starting with /api is forwarded to Spring Boot.
    // The browser only ever talks to localhost:3000 (same origin), so there's no CORS error.
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // where your backend runs
        changeOrigin: true,              // makes the request look like it came from 8080 itself
      },
    },
  },

  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        /**
         * Vendor chunking: libraries change far less often than our code.
         * Putting them in separate files means that after a deploy the
         * browser re-downloads only our small app chunks, while React and
         * Recharts stay cached. Recharts (~400 KB) is also only fetched
         * by the Dashboard and Analytics pages that actually use it.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // clsx is used by our Sidebar AND by Recharts. Without its own rule Rollup
          // would bundle it inside vendor-charts, forcing every page to download charts.
          if (id.includes('/clsx/')) return 'vendor-utils'
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) return 'vendor-charts'
          if (id.includes('react-router') || id.includes('@remix-run')) return 'vendor-router'
          if (id.includes('lucide-react')) return 'vendor-icons'
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react'
        },
      },
    },
  },
})
