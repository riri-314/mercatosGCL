# Se connecter en tant qu’un cercle

Administrators can use **Se connecter** in the Cercles section. The
`becomecercle` callable verifies the administrator, the selected edition’s
membership, and the existing Authentication account. Disabled accounts and
administrator accounts cannot be selected.

The client signs in with the returned custom token using its existing Firebase
Auth instance. This replaces the admin login, including in other tabs sharing
the persisted login. No administrator credentials or restoration token are
retained. Returning to administration requires a normal admin sign-in.

The token has `cercleSession` and `cercleSessionName` claims. These are scoped to
this login; the user’s account-level claims and other sessions are unchanged.
The Auth provider reads the ID token before rendering the signed-in application
and listens for token changes. A fixed red banner remains visible after reload
and navigation, identifies the selected cercle, and provides **Se déconnecter**.
All normal calls, writes, balances, and permissions use the cercle’s actual UID.

## Deployment

Deploy the `becomecercle` function and the frontend together. The function’s
runtime service account must have `iam.serviceAccounts.signBlob` permission on
the signing service account, and the IAM Service Account Credentials API must
be enabled. This can be configured with the Service Account Token Creator role
scoped to that service account; no downloaded private key is needed. See
[Firebase custom token setup](https://firebase.google.com/docs/auth/admin/create-custom-tokens).

The standard Firebase login lifetime applies. The custom token’s one-hour
expiration is a sign-in deadline, not a one-hour limit on the resulting user
session. Logging out ends the browser’s cercle login and does not restore the
administrator login or sign out the cercle’s other devices.

## Browser verification

Start an isolated frontend for the test emulators:

```sh
VITE_USE_EMULATORS=true VITE_EMULATOR_PROJECT_ID=demo-mercatos-security VITE_AUTH_EMULATOR_PORT=9098 VITE_FIRESTORE_EMULATOR_PORT=8180 VITE_STORAGE_EMULATOR_PORT=9198 VITE_FUNCTIONS_EMULATOR_PORT=5001 npm run dev -- --host 127.0.0.1 --port 5176 --strictPort
```

With the optional Playwright installation described in
[performance checks](performance.md), build and run:

```sh
npm run build --prefix functions
PLAYWRIGHT_MODULE_PATH=/path/to/playwright-core functions/node_modules/.bin/firebase emulators:exec --only firestore,auth,storage,functions --project demo-mercatos-security --config firebase.test.json "node functions/scripts/seed-emulators.cjs && node tooling/become-cercle-browser.cjs"
```

The check refuses non-local emulator hosts and non-demo project configuration.
Browser requests to production Firebase hosts are blocked. It uses only the
synthetic `demo-admin` and `demo-buyer` accounts, verifies replacement in a
second tab and after reload, submits an emulator bid, checks the resulting
cercle balance and sender, rejects an admin-only call, and logs out. It also
checks the banner and dialogs at 320, 390 and 1440 pixels and saves screenshots
under the system temporary directory in `mercatos-become-preview`.
