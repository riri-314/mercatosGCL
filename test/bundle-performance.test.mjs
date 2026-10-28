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

test('account routes leave editors, uploaders and date pickers behind their form interactions', async () => {
  const report = await bundleReport();
  for (const source of ['src/pages/account.tsx', 'src/pages/admin-account.tsx']) {
    const route = report.routes[source];
    assert.deepEqual(route.eagerFormDependencies, [], `${source} eagerly loads form dependencies`);
    assert.ok(route.additionalGzipBytes < 200000, `${source} exceeded its 200 KB gzip route budget`);
  }
});
