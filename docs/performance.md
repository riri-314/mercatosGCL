# Performance measurements

## Further frontend improvements (2026-10-28)

The follow-up pass shares decoded edition data through a WeakMap keyed by the
immutable snapshot. Consumers reuse the same object; table rows are memoized and
profile rows copy their metadata instead of mutating shared data. Old snapshots
can be garbage-collected normally.

Creation panels mount on first expansion and retain drafts after collapsing.
Edit forms load when their modal opens. The rich-text editor, date pickers,
image compressor and Storage SDK stay outside the initial account route graph.
The report uses each route's static imports, excluding lazy form imports:

| Metric | Before | After |
| --- | ---: | ---: |
| Additional admin JavaScript, gzip | ~470 KB | ~145 KB |
| Additional member JavaScript, gzip | ~196 KB | ~139 KB |
| Shared entry JavaScript, gzip | ~305 KB | ~307 KB |
| Shared logo SVG, raw | 235,368 bytes | 120,410 bytes |
| Shared logo SVG, gzip (Node default) | 92,149 bytes | 49,228 bytes |

These are build sizes, not measured production latency improvements. The shared
entry grows slightly to support the new hooks; the logo's gzip reduction more
than offsets that increase on dashboard routes. The logo was optimized with
SVGO 4, one decimal place and multiple passes. An 800-pixel raster comparison
had a mean absolute channel difference of 0.15 out of 255.

Countdown badges share one clock and subscribe only while visible. The clock
pauses when the document is hidden. Cards and grids update at auction boundaries
instead of every second; results also move to the closed tab at expiry without
requiring a new snapshot. Collapsed mobile groups mount on first expansion.
Tests check countdown updates without parent renders, offscreen suspension and
start/stop behavior.

The administrator edition table queries ten editions at a time, plus one lookahead
document to determine whether another page exists. Refreshes query the current
page; active edition controls use the existing live subscription. Filtering and
column sorting apply to the displayed page. The browser fixture includes thirteen
editions to exercise forward and backward cursor navigation.

New and replacement photos produce a WebP thumbnail, at most 160 pixels on the
longest edge with a 15 KB compression target. Both images upload before the profile
is saved. Failed thumbnail compression falls back to the compressed original;
existing profiles without thumbnails remain supported. Avatars use a native lazy image inside MUI's
frame, avoiding Avatar's eager JavaScript image preload. Full card images also use
native lazy loading and asynchronous decoding. Upload preview URLs are revoked
when replaced or unmounted. Original photos and thumbnails share the edition's
Storage prefix, so edition locking continues to revoke both.

Deploy the Functions changes before or together with Hosting: profile validation
now accepts the optional `pictureThumbnail` field. No production backfill is
performed; older photos get thumbnails when replaced.

`npm run test:bundle` now also caps each account route's additional JavaScript at
200 KB gzip and rejects eagerly loaded form dependencies. `npm run analyze:bundle`
prints those route measurements. The emulator browser smoke check opens both
profile forms, selects a picture, loads the edition editor and navigates archives.

## Earlier startup improvements

The initial route now uses automatic bundler splitting. The former vendor groups
made the chart chunk an eager dependency because shared React code ended up in it.
Storage and callable Functions initialization live in route-only modules. Analytics
is opt-in and initializes during browser idle time. Result charts mount only when
their card approaches the viewport, and the comitards page decodes its Firestore
snapshot once per update instead of once per clock tick.

## Browser comparison

Three cold Chromium runs per build, 390 × 844 viewport, 4× CPU throttling,
40 ms network latency and 200,000 bytes/s configured download throughput. External
requests were blocked in both builds, so these numbers isolate local frontend
startup on the empty results route. The expected offline Firebase error occurred
in both builds. These are controlled measurements, not production latency estimates.

| Metric | Before | After |
| --- | ---: | ---: |
| Downloaded JavaScript, decoded bytes | 1,420,506 | 1,011,295 |
| JavaScript resources | 19 | 17 |
| Median first contentful paint | 2,668 ms | 2,116 ms |
| Median results visible | 3,096 ms | 2,618 ms |

The final entry graph is about 971 KB raw / 305 KB gzip. Its chart and the Storage,
Functions and Analytics implementation modules are deferred. The bundle check uses
actual module membership rather than scanning SDK package-name strings, since the
Firebase App registry includes names of packages that are not loaded.

Reproduce the build and inspect its dependency graph:

```sh
npm run test:bundle
npm run analyze:bundle
```

The regression check caps the eager graph at 330 KB gzip and rejects eager charts
or route-only Firebase services. It reads build metadata under `dist/.vite`.

For the optional browser probe, install Playwright Core outside the checkout and
start `npm run preview -- --port 4173 --strictPort` in another terminal:

```sh
npm install --prefix /tmp/mercatos-perf-tools --no-package-lock --no-save playwright-core
PLAYWRIGHT_MODULE_PATH=/tmp/mercatos-perf-tools/node_modules/playwright-core npm run benchmark:browser
```

`CHROMIUM_PATH` can override `/usr/bin/chromium-browser`. The probe accesses only
localhost and blocks external requests. It prints results and optionally writes
full metrics when given an output path.

## Emulator browser smoke check

The optional browser smoke check exercises visitor edition data, member login,
admin login and both account routes. It also covers the uploader's legacy CommonJS
interop and rejected account-status requests, which mocked Firebase tests cannot
fully exercise. Start the frontend in a terminal:

```sh
VITE_USE_EMULATORS=true VITE_EMULATOR_PROJECT_ID=demo-mercatos-security VITE_AUTH_EMULATOR_PORT=9098 VITE_FIRESTORE_EMULATOR_PORT=8180 npm run dev -- --port 5175 --strictPort
```

Then run against isolated emulator data (using the optional Playwright installation
from above):

```sh
PLAYWRIGHT_MODULE_PATH=/tmp/mercatos-perf-tools/node_modules/playwright-core functions/node_modules/.bin/firebase emulators:exec --only firestore,auth --project demo-mercatos-security --config firebase.test.json "npm run seed:emulators --prefix functions && npm run test:browser"
```

The browser blocks external requests and uses only the synthetic fixture accounts.

## Shared edition document

Run the transaction probe against an isolated local demo project:

```sh
npm run benchmark:edition --prefix functions
```

The fixture contains 20 auctions, 10 buyers and 400 existing bids. Each sample
submits 20 valid bids through the real bidding handler. One emulator run produced:

| Concurrent requests | Committed bids | Batch duration | p50 | p95 |
| --- | ---: | ---: | ---: | ---: |
| 1 | 20/20 | 499 ms | 22 ms | 67 ms |
| 5 | 20/20 | 3,337 ms | 17 ms | 3,337 ms |
| 20 | 20/20 | 12,659 ms | 7,093 ms | 12,659 ms |

The serialized document grew from approximately 45.4 KB to 48.0 KB. These are JSON
payload sizes, not Firestore's storage-size accounting. Every committed bid kept
the aggregate balance invariant. The probe refuses non-local or non-demo projects
and removes its synthetic document afterward.

Contention is measurable even with this small document. This pass retains the
schema; emulator timings cannot establish production capacity. Before a larger
edition, measure production bid latency, retries and peak concurrency. If the
observed workload needs it, migrate auction state and circle balances into separate
documents in one planned data migration, preserving atomic debits and settlement.

The index configuration now includes the active-edition query and exempts the
unqueried `cercles` map, rules text, operation account checkpoints and operation
signature. Map subfields inherit the exemption, reducing unused index maintenance.
See Firebase's [indexing guidance](https://firebase.google.com/docs/firestore/best-practices#indexes)
and [map exemption behavior](https://firebase.google.com/docs/firestore/query-data/index-overview#automatic_index_exemptions).
The emulator does not model production index fanout, so the probe does not claim
an index-related latency improvement. Deploy `firestore:indexes` with the application.
