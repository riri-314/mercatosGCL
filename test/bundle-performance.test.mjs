import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bundleReport } from '../tooling/bundle-report.mjs';

test('the built entry keeps charts and admin-only services deferred', async () => {
  const report = await bundleReport();
  assert.ok(report.deferredCharts.length > 0, 'The chart needs its own dynamic chunk');
  assert.ok(report.deferredCharts.every(chunk => !chunk.eager), 'Charts must stay off the entry graph');
  assert.ok(report.eagerGzipBytes < 330000, `Entry graph exceeded its budget: ${report.eagerGzipBytes}`);
  assert.deepEqual(report.eagerFirebaseServices, [], 'Route-only Firebase services must stay deferred');
});
