import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  build: {
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        // Only group libraries that are either needed on every page (react,
        // firebase) or already lazy-loaded (recharts). MUI is intentionally
        // left to automatic splitting so admin-only components stay
        // in the admin route chunk instead of loading on the home page.
        codeSplitting: {
          groups: [
            { name: 'firebase', test: /node_modules\/(?:@firebase|firebase)\// },
            { name: 'charts', test: /node_modules\/(?:recharts|d3-[^/]+|victory-vendor)\// },
            { name: 'react-vendor', test: /node_modules\/(?:react|react-dom|react-router[^/]*|scheduler)\// },
          ],
        },
      },
    },
  },
})
