## MercatosGCL

![license](https://img.shields.io/badge/license-MIT-blue.svg)

> Website for the GCL mercatos

![preview](public/assets/mercatoScreen.png)

## Link
- [Public link](https://mercatosgcl.web.app/)

## Quick start

- **Clone** `git clone https://github.com/riri-314/mercatosGCL.git`
- Use Node.js 24.15+ (24.x LTS is also the Cloud Functions runtime).
- **Install:** `npm install`
- **Start:** `npm run dev`
- **Build:** `npm run build`

Development and preview bind to `127.0.0.1`. To deliberately expose the development
server, run `npm run dev -- --host`. Run `npm run test:dev-security` to check local
file access restrictions and the default binding.

## Emulator

Use synthetic fixtures; never import production account or database exports into Git.
Start the emulators with the installed CLI:

```sh
functions/node_modules/.bin/firebase emulators:start --project demo-mercatos-local
```

In another terminal, seed the running Authentication and Firestore emulators:

```sh
GCLOUD_PROJECT=demo-mercatos-local FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 npm run seed:emulators --prefix functions
```

The fixture creates three accounts at `demo-{admin,buyer,seller}@example.test`,
with the development-only password `EmulatorOnly123!`. Re-running it resets the
synthetic edition. The seeder refuses non-demo projects and non-local hosts.
Start the frontend with `VITE_USE_EMULATORS=true npm run dev`; no source edits
are needed. `VITE_EMULATOR_PROJECT_ID` defaults to `demo-mercatos-local`.
Port overrides are `VITE_AUTH_EMULATOR_PORT`, `VITE_FIRESTORE_EMULATOR_PORT`,
`VITE_FUNCTIONS_EMULATOR_PORT`, and `VITE_STORAGE_EMULATOR_PORT`.
Production analytics are opt-in with `VITE_ENABLE_ANALYTICS=true` and initialize
when the browser is idle.

Previously tracked exports contained emulator passwords and personal data. They
have been removed from this checkout and local Git history. Any credentials reused
outside the emulator must be rotated by their owners. Existing clones and remote
branches need the sanitized history; do not merge the old history back in.

## Tests

Install both sets of dependencies with `npm ci` and `npm ci --prefix functions`.
Run `npm test` from the repository root to type-check the tests and run the frontend,
development-server security, and backend suites.

| Command | Scope |
| --- | --- |
| `npm run test:frontend` | React components, hooks, and client utilities with Vitest and Testing Library |
| `npm run test:watch` | Frontend tests in watch mode |
| `npm run test:coverage` | Frontend coverage in the terminal and `coverage/index.html` |
| `npm run test:typecheck` | Type-check application and frontend test code |
| `npm run test:dev-security` | Development-server binding and file access restrictions |
| `npm run test:backend` | Cloud Functions, Firestore rules, and Storage rules against local emulators |

Frontend tests cover login and password recovery, authentication and edition data
providers, route access, auction controls and mutation confirmations, results, and
admin bid deletion and edition activation. Firebase services are mocked, so these
tests do not initialize the production app or analytics.

Profile form tests exercise the real inputs and image picker for members and admins.
They cover required fields, numeric zero values, upload progress and failures,
download URL failures, rejected or unconfirmed saves, retries, cancellation, form
reset after creation, and circle ownership when display names are duplicated.
Image compression and Firebase calls are mocked.

Backend tests cover bidding and settlement transactions, timing and balance
boundaries, profile validation and ownership, account creation and rollback, admin
account operations, and database access rules. Storage tests cover public active
pictures, archive restrictions, circle ownership, MIME and size limits, immutable
member uploads, and administrator access. The backend command builds the
functions and starts isolated Firestore, Authentication, and Storage emulators with
`firebase.test.json` and the `demo-mercatos-security` project. Java 21 or later is
required; ports 8180, 9098, and 9198 must be available. Tests refuse to run against
production and use only synthetic test data. Backend test files run
sequentially because they clear the same emulator database between tests.

## Performance

See [measurements, bundle checks and the local load probe](docs/performance.md).

## Edition operations

Edition creation, activation and bulk password resets are resumable server operations.
See [operation lifecycle, recovery and deployment](docs/edition-operations.md).

## Cercle account switching

Administrators can sign in as a cercle from the Cercles section. See
[session behavior, warning banner and deployment](docs/become-cercle.md).

## Dependency maintenance

React 18, Material UI 5 / MUI X 6, TypeScript 5, and ESLint 8 stay on their latest
compatible releases for the existing components and ESLint configuration. MUI Base
and Lab prereleases are pinned to avoid accidentally installing development builds.
The Firebase CLI is a development dependency; deployed functions only depend on the
Admin and Functions SDKs.

The overrides keep `react-is` aligned with React 18 and patch Firebase's Node gRPC
dependency and the CLI's CommonJS UUID dependency. The current Firebase CLI still
has three moderate audit findings from its Pub/Sub / OpenTelemetry dependency
chain. Check `npm audit` and `npm audit --prefix functions` when updating; production
backend dependencies can be checked with `npm audit --omit=dev --prefix functions`.




Todo Henri:
modifier supprimer encheres, tout à faire

Todo Flo:
modifier supprimer encheres, tout à faire
changer create comitard pour avoir petite photo
optimiser page résultats, trop lente
