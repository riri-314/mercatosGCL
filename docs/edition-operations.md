# Edition operations

Creating or activating an edition and bulk password resets use Cloud Functions.
The browser persists an operation ID before making a request; retries of that ID
resume the same operation. The backend serializes edition operations, records each
stage in `editionOperations`, and leases execution to one worker for ten minutes.
Functions time out after nine minutes, allowing a crashed worker's lease to expire.
A scheduled function checks pending work every five minutes, with exponential retry delay
up to 32 minutes. Administrators can inspect progress and retry from their account.

Transitions freeze affected editions, including uploads and auction/account/profile
mutations. Old public picture tokens are revoked and verified before the target is
activated. The target's picture tokens are restored before mutations resume.
Password resets happen after the edition is committed, with individual checkpoints
for resetting each account and requesting its recovery email. A failed email request
therefore does not reset that password again on retry. Lost email acknowledgements
can result in duplicate recovery emails; delivery requests are retried at least once.

Recovery emails use Firebase's configured template via the authenticated
[Identity Platform sendOobCode API](https://cloud.google.com/identity-platform/docs/reference/rest/v1/accounts/sendOobCode).
The runtime service account needs `firebaseauth.users.sendEmail`, in addition to
its existing Firestore, Storage and Authentication access. A missing permission is
reported as pending email delivery and is retried after access is corrected.
No SMTP credentials or password values are saved in operation documents.

Deploy the functions, rules and frontend together:

```sh
npm run build
functions/node_modules/.bin/firebase deploy --only functions,firestore,storage,hosting
```

This deployment is intentionally a separate step from local development and commits.
Older clients cannot directly change edition activation after the rules upgrade.
The existing “Sécuriser les photos des anciennes éditions” action remains available
for archives created before these transitions were introduced.

Run `npm run test:backend` for failure, transaction, retry, authorization and rules
coverage. Firestore and Authentication use real emulators. The Storage emulator
merges token metadata rather than honoring production GCS token deletion; workflow
tests model GCS token-field replacement while using real emulated file listing and
I/O. An explicit test verifies that unconfirmed revocation prevents activation.
