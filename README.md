## MercatosGCL

![license](https://img.shields.io/badge/license-MIT-blue.svg)

> Website for the GCL mercatos

![preview](public/assets/mercatoScreen.png)

## Link
- [Public link](https://mercatosgcl.web.app/)

## Quick start

- **Clone** `git clone https://github.com/riri-314/mercatosGCL.git`
- Recommended `Node.js v20.x`.
- **Install:** `npm install`
- **Start:** `npm run dev`
- **Build:** `npm build`

## Emulator
First change debug to true in firebase_config.ts

Importing firestore data to local storage: gsutil -m cp -r gs://mercatosgcl.appspot.com/bucket_export_test .
source: https://stackoverflow.com/questions/57838764/how-to-import-data-from-cloud-firestore-to-the-local-emulator

bucket_export_test is the folder containing the firestore data
firebase emulators:start --import ./bucket_export_test/2024-10-28T12\:20\:20_28227/ --export-on-exit

Importing the pictures:
I have no fucking idea.


Todo Henri:

eventListener sur le document de l'edition si connecté

Opti:
optimiser page comitards
optimiser page résultats, trop lente

admin:
admin peut voter dans backend??? Yes
Retirer admin vote dans la page comitards
ajouter, modifier supprimer encheres, tout à faire
ajouter boutton pour bloquer edit comitard (par admin)
changer adresse mail d'un président //caca mais faisable en backend admin

Todo Flo:
changer create comitard pour avoir petite photo

