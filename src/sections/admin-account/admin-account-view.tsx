import type { useEditionHistory } from "../../data/use-edition-history";
import { getEditionData } from "../../data/edition-data";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import {
  Alert,
  CardContent,
  Modal,
} from "@mui/material";
import { useAuth } from "../../auth/AuthProvider";
import { LoadingButton } from "@mui/lab";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import NewCerle from "./new_cercle";
import { functions } from "../../firebase_functions";
import NewComitard from "./new_comitard";
import { DocumentData } from "firebase/firestore";
import { lazy, Suspense, useState } from "react";
import Box from "@mui/material/Box";
import DeferredPanel from "../../components/deferred-panel/deferred-panel";
import QuickFilteringGrid from "./edition_table";
import CercleTable from "./cercle_table";
import ComitardTable from "./comitard_table";
import EncheresTable from "./enchere_table.tsx";
import { lockAllPastEditions, resetEditionPasswords } from "../../utils/admin-tools";

import EditionOperationStatus from "./edition-operation-status";

const NewEdition = lazy(() => import("./new_edition"));
const EditCerle = lazy(() => import("./edit_cercle"));
const EditComitard = lazy(() => import("./edit_comitard"));
const EditEnchere = lazy(() => import("./edit_enchere.tsx"));
const EditMDP = lazy(() => import("./edit_mdp.tsx"));

interface AdminAccountProps {
  history: ReturnType<typeof useEditionHistory>;
  refetchData: () => void;
  activeData: DocumentData;
}

export default function AdminAccount({
  history,
  refetchData,
  activeData,
}: AdminAccountProps) {
  const { user } = useAuth();
  const [passwordResult, setPasswordResult] = useState("");
  const [resettingPasswords, setResettingPasswords] = useState(false);
  const [errorEditionEdit, setErrorEditionEdit] = useState("");
  const [lockingPast, setLockingPast] = useState(false);
  const [lockPastResult, setLockPastResult] = useState("");
  const [openModalEdition, setOpenModalEdition] = useState(false);
  const handleOpenModalEdition = () => setOpenModalEdition(true);
  const handleCloseModalEdition = () => setOpenModalEdition(false);
  const [modalEditionData, setModalEditionData] = useState<any | null>(null);

  const [openModalCercle, setOpenModalCercle] = useState(false);
  const [modalCercleData, setModalCercleData] = useState<any | null>(null);

  const [openModalMDP, setOpenModalMDP] = useState(false);
  const [modalMDPData, setModalMDPData] = useState<any | null>(null);

  const [openModalComitard, setOpenModalComitard] = useState(false);
  const [modalComitardData, setModalComitardData] = useState<any | null>(null);

  const [openModalEnchere, setOpenModalEnchere] = useState(false);
  const [modalEnchereData, setModalEnchereData] = useState<any | null>(null);

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
      >
        <Typography variant="h4" sx={{ mb: 1 }}>
          Bonjour, bienvenue {user && user?.email} 👋
        </Typography>
      </Stack>

      <EditionOperationStatus refetchData={refetchData} />
      <DeferredPanel title="Créer une nouvelle édition">
        <NewEdition data={getEditionData(activeData) ?? {}} refetchData={refetchData} />
      </DeferredPanel>

      <Card sx={{ width: "100%", mb: 4, p: 2 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Éditer édition
          </Typography>
          <QuickFilteringGrid
            history={history}
            refetchData={refetchData}
            error={(error) => setErrorEditionEdit(error)}
            handleOpenModalEdition={(data: any) => {
              console.log("modal open:", data);
              setModalEditionData(data);
              handleOpenModalEdition();
            }}
          />
          {errorEditionEdit && (
            <Alert sx={{ mt: 3 }} severity={"error"}>
              {errorEditionEdit}
            </Alert>
          )}
          <LoadingButton
            sx={{ mt: 2 }}
            variant="outlined"
            color="warning"
            loading={lockingPast}
            onClick={async () => {
              setLockingPast(true);
              setLockPastResult("");
              const ret = await lockAllPastEditions();
              setLockPastResult(
                ret
                  ? "Photos des anciennes éditions sécurisées."
                  : "Erreur lors de la sécurisation des anciennes éditions."
              );
              setLockingPast(false);
            }}
          >
            Sécuriser les photos des anciennes éditions
          </LoadingButton>
          {lockPastResult && (
            <Alert
              sx={{ mt: 2 }}
              severity={lockPastResult.startsWith("Erreur") ? "error" : "success"}
            >
              {lockPastResult}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Modal
        open={openModalEdition}
        onClose={handleCloseModalEdition}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{
          m: 3,
          overflow: "scroll",
          maxWidth: 800,
          ml: "auto",
          mr: "auto",
        }}
      >
        <Box tabIndex={-1}>{openModalEdition && <Suspense fallback={<div role="status">Chargement…</div>}>

        <Card sx={{ width: "100%", mb: 4 }}>
          <CardContent>
            <Typography variant="h5">Éditer l'édition</Typography>
            <NewEdition
              data={modalEditionData}
              refetchData={refetchData}
              updateMode={true}
              close={handleCloseModalEdition}
            />
          </CardContent>
        </Card>
        </Suspense>}</Box>
      </Modal>

      <NewCerle refetchData={refetchData} editionId={activeData.id} />

      <Card sx={{ width: "100%", mb: 4, p: 2 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Éditer, supprimer cercle
          </Typography>
          <CercleTable
            data={activeData}
            refetchData={refetchData}
            handleOpenModalCercle={(data: any) => {
              setOpenModalCercle(true);
              setModalCercleData(data);
            }}
            handleOpenModalMDP={(data: any) => {
              setOpenModalMDP(true);
              setModalMDPData(data);
            }}
          />
        </CardContent>
      </Card>

      <Modal
        open={openModalMDP}
        onClose={() => setOpenModalMDP(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{
          m: 3,
          overflow: "scroll",
          maxWidth: 800,
          ml: "auto",
          mr: "auto",
        }}
      >
        <Box tabIndex={-1}>{openModalMDP && <Suspense fallback={<div role="status">Chargement…</div>}>

        <Card sx={{ width: "100%", mb: 4 }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 1 }}>
              Changer le mdp du cercle - {modalMDPData ? modalMDPData.name : ""}
            </Typography>
            <EditMDP
              refetchData={refetchData}
              data={modalMDPData}
              close={() => setOpenModalMDP(false)}
              editionId={activeData.id}
            />
          </CardContent>
        </Card>
        </Suspense>}</Box>
      </Modal>

      <Modal
        open={openModalCercle}
        onClose={() => setOpenModalCercle(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{
          m: 3,
          overflow: "scroll",
          maxWidth: 800,
          ml: "auto",
          mr: "auto",
        }}
      >
        <Box tabIndex={-1}>{openModalCercle && <Suspense fallback={<div role="status">Chargement…</div>}>

        <Card sx={{ width: "100%", mb: 4 }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 1 }}>
              Éditer le cercle
            </Typography>
            <EditCerle
              refetchData={refetchData}
              data={modalCercleData}
              close={() => setOpenModalCercle(false)}
              editionId={activeData.id}
            />
          </CardContent>
        </Card>
        </Suspense>}</Box>
      </Modal>

      <NewComitard data={activeData} admin={true} refetchData={refetchData} />

      <Card sx={{ width: "100%", mb: 4, p: 2 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Éditer, supprimer comitard
          </Typography>
          <ComitardTable
            data={activeData}
            refetchData={refetchData}
            admin={true}
            handleOpenModalComitard={(data: any) => {
              setOpenModalComitard(true);
              setModalComitardData(data);
              console.log("modal open:", data);
            }}
          />
        </CardContent>
      </Card>

      <Modal
        open={openModalComitard}
        onClose={() => setOpenModalComitard(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{
          m: 3,
          overflow: "scroll",
          maxWidth: 800,
          ml: "auto",
          mr: "auto",
        }}
      >
        <Box tabIndex={-1}>{openModalComitard && <Suspense fallback={<div role="status">Chargement…</div>}>

        <EditComitard
          refetchData={refetchData}
          ComitardData={modalComitardData}
          activeData={activeData}
          close={() => setOpenModalComitard(false)}
          admin={true}
        />
        </Suspense>}</Box>
      </Modal>

      <Card sx={{ width: "100%", mb: 4, p: 2 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Éditer, supprimer enchère
          </Typography>
          <EncheresTable
            data={activeData}
            admin={true}
            refetchData={refetchData}
            handleOpenModalEnchere={(data: any) => {
              setOpenModalEnchere(true);
              setModalEnchereData(data);
            }}
          />
        </CardContent>
      </Card>

      <Modal
        open={openModalEnchere}
        onClose={() => setOpenModalEnchere(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{
          m: 3,
          overflow: "scroll",
          maxWidth: 800,
          ml: "auto",
          mr: "auto",
        }}
      >
        <Box tabIndex={-1}>{openModalEnchere && <Suspense fallback={<div role="status">Chargement…</div>}>

        <EditEnchere
          data={activeData}
          enchereData={modalEnchereData}
          refetchData={refetchData}
          close={() => setOpenModalEnchere(false)}
        />
        </Suspense>}</Box>
      </Modal>

      <Card sx={{ width: "100%", mb: 4, p: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Paramètres admin</Typography>
            <Stack direction="row" spacing={1}>
              <LoadingButton
                variant={"outlined"}
                size={"large"}
                onClick={async () => {
                  const auth = getAuth();
                  sendPasswordResetEmail(auth, user?.email ?? "")
                    .then(() => {
                      // Password reset email sent!
                      console.log("Password reset email sent!");
                      // ..
                    })
                    .catch((error) => {
                      const errorMessage = error.message;
                      console.log("error reset password:", errorMessage);
                      // ..
                    });
                }}
              >
                Réinitialiser mon mot de passe
              </LoadingButton>
              <LoadingButton
                variant={"outlined"}
                size={"large"}
                onClick={async () => {
                  setResettingPasswords(true);
                  setPasswordResult("");
                  try {
                    await resetEditionPasswords(activeData.id);
                    setPasswordResult("Mots de passe réinitialisés et e-mails de récupération envoyés.");
                  } catch (cause: unknown) {
                    setPasswordResult(cause instanceof Error ? cause.message : "La réinitialisation n'a pas abouti.");
                  } finally {
                    setResettingPasswords(false);
                  }
                }}
                loading={resettingPasswords}
              >
                Réinitialiser tous les mots de passe DANGER
              </LoadingButton>
              {passwordResult && <Alert severity="info">{passwordResult}</Alert>}
              <LoadingButton
                variant={"outlined"}
                size={"large"}
                onClick={async () => {
                  const addMessage = httpsCallable(functions, "rembour");
                  addMessage({ text: "Test super function" }).then((result) => {
                    // Read result of the Cloud Function.
                    /** @type {any} */
                    const data: any = result.data;
                    //const sanitizedMessage = data.text;
                    console.log("data:", data);
                  });
                }}
              >
                Remboursement
              </LoadingButton>

            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
