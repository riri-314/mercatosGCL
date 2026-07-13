import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Only group libraries needed on every page (react, firebase). MUI is
        // left to Rollup's automatic splitting so admin-only components stay in
        // the admin route chunk instead of loading on the home page. recharts
        // is deliberately NOT grouped here: it is already lazy-loaded via
        // React.lazy, so Rollup gives it its own dynamic chunk with correct
        // module init order (manually grouping it caused a TDZ init error).
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase'
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
