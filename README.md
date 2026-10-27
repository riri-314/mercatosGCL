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
First change debug to true in firebase_config.ts

### Importing firestore data to local storage: 

gsutil -m cp -r gs://bucket_export_test/2025-02-10T17\:25\:33_46845 ~/git/mercatosGCL

source: https://stackoverflow.com/questions/57838764/how-to-import-data-from-cloud-firestore-to-the-local-emulator

### Start the emulator
firebase emulators:start --import ./2025-02-10T17:25:33_46845 --export-on-exit

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
| `npm run test:backend` | Cloud Functions and Firestore security rules against local emulators |

Frontend tests cover login and password recovery, authentication and edition data
providers, route access, auction controls and mutation confirmations, results, and
admin bid deletion and edition activation. Firebase services are mocked, so these
tests do not initialize the production app or analytics.

Backend tests cover bidding and settlement transactions, timing and balance
boundaries, profile validation and ownership, account creation and rollback, admin
account operations, and database access rules. The backend command builds the
functions and starts isolated Firestore and Authentication emulators with
`firebase.test.json` and the `demo-mercatos-security` project. Java 21 or later is
required; ports 8180 and 9098 must be available. Tests refuse to run against
production and do not import the repository's account or database exports. Backend test files run
sequentially because they clear the same emulator database between tests.

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
