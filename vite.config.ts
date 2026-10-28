import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'

const bundleModuleMap: Plugin = {
  name: 'bundle-module-map',
  generateBundle(_options, bundle) {
    const modules = Object.fromEntries(Object.values(bundle)
      .filter(chunk => chunk.type === 'chunk')
      .map(chunk => [chunk.fileName, Object.keys(chunk.modules)
        .map(id => id.replaceAll('\\', '/').replace(`${process.cwd()}/`, ''))]));
    this.emitFile({ type: 'asset', fileName: '.vite/chunk-modules.json', source: JSON.stringify(modules) });
  },
}

export default defineConfig({
  plugins: [react(), bundleModuleMap],
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  // Route-only dependencies must not enter shared eager vendor chunks.
  build: { manifest: true, chunkSizeWarningLimit: 700 },
})
