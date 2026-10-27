import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { createServer, resolveConfig } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));

test('development and preview bind to loopback by default', async () => {
  const config = await resolveConfig({ root }, 'serve');
  assert.equal(config.server.host, '127.0.0.1');
  assert.equal(config.preview.host, '127.0.0.1');
});

test('development serves the app but denies external files and raw-query bypasses', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'mercatos-vite-test-'));
  const marker = randomUUID();
  const filename = path.join(directory, 'private-marker.txt');
  await writeFile(filename, marker);
  const server = await createServer({ root,
    server: { port: 0, strictPort: true },
    logLevel: 'silent',
  });
  try {
    await server.listen();
    const address = server.httpServer.address();
    const origin = `http://127.0.0.1:${address.port}`;
    assert.equal((await fetch(origin)).status, 200);
    assert.equal((await fetch(`${origin}/src/main.tsx`)).status, 200);
    for (const query of ['', '?raw??', '?import&raw??', '?inline&import']) {
      const response = await fetch(`${origin}/@fs${filename}${query}`);
      assert.equal(response.status, 403, `External file should be denied for ${query}`);
      assert.equal((await response.text()).includes(marker), false);
    }
  } finally {
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});
