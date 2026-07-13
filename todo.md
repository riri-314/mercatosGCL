1. Blur pictures by default. Get a butun to unblur. The admin can flag the picture as okay and no blur will be shown
2. Check security of the picture storage. I don't want old pictures editions to be visible
   DONE (parts 1-3): old-edition picture files are kept but their public download
   tokens are revoked when an edition closes, so leaked/shared URLs stop working.
   - storage.rules: `get` restricted to admins (active edition still served via
     tokenized URLs which bypass rules).
   - functions: lockeditionpictures / unlockeditionpictures / lockallpasteditions.
   - admin-tools: newEdition locks the closing edition; setActiveEdition
     unlocks the re-activated one and locks the deactivated ones.
   - admin UI: "Sécuriser les photos des anciennes éditions" button (run once to
     lock the editions that are already inactive).
   TODO part 4 (later): admin viewer to actually browse past editions — needs an
   edition picker + loading inactive-edition images via getBlob (rules allow admin)
   instead of <img src=url>.
   DEPLOY: firebase deploy --only functions,storage
   Then click the "Sécuriser..." button once as admin to migrate existing editions.
rules_version = '2';

// Craft rules based on data in your Firestore database
// allow write: if firestore.get(
//    /databases/(default)/documents/users/$(request.auth.uid)).data.isAdmin;

service firebase.storage {
  match /b/{bucket}/o {
    //allow write: if firestore.get(/databases/(default)/documents/admin/admin).data.addmins[request.auth.token.email] == request.auth.uid;
    match /{editionID}/{userID}/{fileName} {
      allow get: if true;
      allow list: if false;
      allow update: if firestore.get(/databases/(default)/documents/admin/admin).data.admins[request.auth.token.email] == request.auth.uid;
      allow delete: if firestore.get(/databases/(default)/documents/admin/admin).data.admins[request.auth.token.email] == request.auth.uid;
    	allow create: if (request.resource.size < 5 * 1024 * 1024 // limit file size to 5.5mb
                   && request.resource.contentType.matches('image/.*') // limit upload to images types files
                   && request.auth.uid != null // user has to be logged in
                   && firestore.get(/databases/(default)/documents/editions/$(editionID)).data.active == true // user has to upload in a active edition folder
                   && request.auth.uid == userID) // user has to upload in his folder
                   || (firestore.get(/databases/(default)/documents/admin/admin).data.admins[request.auth.token.email] == request.auth.uid) // or if the user is admin
    }
  }
}

3.On the result page. When clicking a commitard picture profile. It show the full profile of the commitard. Like in the comitards page

4. Optimize website. Loading is slow
   DONE (round 1 - bundle/first-paint):
   - vite.config.ts: manualChunks split firebase + react + recharts into
     separate cacheable vendor chunks (MUI left to auto per-route splitting so
     admin-only components don't load on the home page).
   - firebase_config.ts: Analytics no longer initialized eagerly at the app root
     (it was unused) - loaded lazily via dynamic import + isSupported() off the
     critical path.
   - results-card.tsx: recharts chart is now React.lazy + Suspense, so result
     cards paint immediately and charts stream in after (~106 KB gz off the
     first-paint path). Main index bundle: 949 KB -> 174 KB.
   TODO (round 2, optional further wins):
   - public/assets/mercatoScreen.png (932 KB) is referenced NOWHERE - dead
     weight shipped on every deploy. Safe to delete.
   - src/assets/gcl_full.svg is 235 KB - optimize/simplify the SVG.
   - index.html loads 6 Google Font weights (400-900) render-blocking; drop
     unused weights.
   - _mock/results.ts (faker) and admin-account/test.tsx (x-data-grid-generator)
     are unused - remove files + deps to slim node_modules/build.
   - Consider lazy-initializing storage/functions in firebase_config (only
     needed in admin/upload flows, not on the home page).

5. Get small and big picture. Small picture is for small thumbnals. Big is for the comitards page
