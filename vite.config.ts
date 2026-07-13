import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Only group libraries that are either needed on every page (react,
        // firebase) or already lazy-loaded (recharts). MUI is intentionally
        // left to Rollup's automatic splitting so admin-only components stay
        // in the admin route chunk instead of loading on the home page.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase'
          if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-vendor/')) return 'charts'
          if (
            id.includes('/react-dom/') ||
            id.includes('/react-router') ||
            id.includes('/react/') ||
            id.includes('/scheduler/')
          )
            return 'react-vendor'
        },
      },
    },
  },
})
