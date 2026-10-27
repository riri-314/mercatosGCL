import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export async function bundleReport(directory = new URL('../dist/', import.meta.url)) {
  const root = directory instanceof URL ? fileURLToPath(directory) : directory;
  const manifest = JSON.parse(await readFile(path.join(root, '.vite/manifest.json'), 'utf8'));
  const modules = JSON.parse(await readFile(path.join(root, '.vite/chunk-modules.json'), 'utf8'));
  const entry = Object.keys(manifest).find(key => manifest[key].isEntry);
  const eager = new Set();
  function visit(key) {
    if (eager.has(key)) return;
    eager.add(key);
    for (const dependency of manifest[key].imports || []) visit(dependency);
  }
  visit(entry);
  const chunks = await Promise.all([...eager].map(async key => {
    const bytes = await readFile(path.join(root, manifest[key].file));
    return { file: manifest[key].file, bytes: bytes.length, gzipBytes: gzipSync(bytes).length };
  }));
  return { chunks, eagerBytes: chunks.reduce((sum, item) => sum + item.bytes, 0),
    eagerGzipBytes: chunks.reduce((sum, item) => sum + item.gzipBytes, 0),
    eagerFirebaseServices: ['storage', 'functions', 'analytics'].filter(service =>
      chunks.some(chunk => modules[chunk.file]?.some(id => id.includes(`node_modules/@firebase/${service}/`)))),
    deferredCharts: Object.values(manifest).filter(item => item.src?.includes('results-comitard-shart'))
      .map(item => ({ file: item.file, eager: chunks.some(chunk => chunk.file === item.file) })) };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await bundleReport(), null, 2));
}
