import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  CardContent,
  Modal,
} from "@mui/material";
import { useAuth } from "../../auth/AuthProvider";
import { LoadingButton } from "@mui/lab";
import {
  getAuth,
  sendPasswordResetEmail,
  //  updatePassword,
} from "@firebase/auth";
//import firebase from "@firebase/app";
import { httpsCallable } from "@firebase/functions";
import NewCerle from "./new_cercle";
import { functions } from "../../firebase_config";
import NewEdition from "./new_edition";
import NewComitard from "./new_comitard";
import { DocumentData } from "@firebase/firestore";
import { useState } from "react";
import QuickFilteringGrid from "./edition_table";
import CercleTable from "./cercle_table";
import EditCerle from "./edit_cercle";
import ComitardTable from "./comitard_table";

interface AdminAccountProps {
  data: DocumentData[];
  refetchData: () => void;
  activeData: DocumentData;
}

export default function AdminAccount({
  data,
  refetchData,
  activeData,
}: AdminAccountProps) {
  const { user } = useAuth();
  const [errorEditionEdit, setErrorEditionEdit] = useState("");
  const [openModalEdition, setOpenModalEdition] = useState(false);
  const handleOpenModalEdition = () => setOpenModalEdition(true);
  const handleCloseModalEdition = () => setOpenModalEdition(false);
  const [modalEditionData, setModalEditionData] = useState<any | null>(null);

  const [errorCercleEdit, setErrorCercleEdit] = useState("");
  const [openModalCercle, setOpenModalCercle] = useState(false);
  const [modalCercleData, setModalCercleData] = useState<any | null>(null);

  const [errorComitardEdit, setErrorComitardEdit] = useState("");
  const [openModalComitard, setOpenModalComitard] = useState(false);
  const [modalComitardData, setModalComitardData] = useState<any | null>(null);

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

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          <Accordion>
            <AccordionSummary
              expandIcon={<Typography variant="h3">🢃</Typography>}
            >
              <Typography variant="h5">Créer une nouvelle édition</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <NewEdition data={activeData.data()} refetchData={refetchData} />
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Éditer édition
          </Typography>
          <QuickFilteringGrid
            data={data}
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
        <Card sx={{ width: "100%", mb: 4 }}>
          <CardContent>
            <Typography variant="h5">Créer une nouvelle édition</Typography>
            <NewEdition
              data={modalEditionData}
              refetchData={refetchData}
              updateMode={true}
              close={handleCloseModalEdition}
            />
          </CardContent>
        </Card>
      </Modal>

      <NewCerle refetchData={refetchData} />

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Éditer, supprimer cercle
          </Typography>
          <CercleTable
            data={activeData}
            refetchData={refetchData}
            error={(error) => setErrorCercleEdit(error)}
            handleOpenModalCercle={(data: any) => {
              setOpenModalCercle(true);
              setModalCercleData(data);
              //console.log("modal open:", data);
            }}
          />
          {errorCercleEdit && (
            <Alert sx={{ mt: 3 }} severity={"error"}>
              {errorCercleEdit}
            </Alert>
          )}
        </CardContent>
      </Card>

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
        <EditCerle
          refetchData={refetchData}
          data={modalCercleData}
          close={() => setOpenModalCercle(false)}
          editionId={activeData.id}
        />
      </Modal>

      <NewComitard data={activeData} admin={true} refetchData={refetchData} />

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Éditer, supprimer comitard
          </Typography>
          <ComitardTable
            data={activeData}
            refetchData={refetchData}
            admin={true}
            error={(error) => setErrorComitardEdit(error)}
            handleOpenModalComitard={(data: any) => {
              console.log("modal open:", data);
            }}
          />
          {errorComitardEdit && (
            <Alert sx={{ mt: 3 }} severity={"error"}>
              {errorComitardEdit}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          Edit/Remove auctions <br />
        </CardContent>
      </Card>

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          Debug card <br />
          <LoadingButton
            onClick={async () => {
              const auth = getAuth();
              sendPasswordResetEmail(auth, "henri.pihet.807@gmail.com")
                .then(() => {
                  // Password reset email sent!
                  // ..
                })
                .catch((error) => {
                  //const errorCode = error.code;
                  const errorMessage = error.message;
                  console.log("error reset password:", errorMessage);
                  // ..
                });
            }}
          >
            Reset password
          </LoadingButton>
          <LoadingButton
            onClick={async () => {
              const addMessage = httpsCallable(functions, "signUpUser");
              addMessage({ text: "Test super function" }).then((result) => {
                // Read result of the Cloud Function.
                /** @type {any} */
                const data: any = result.data;
                //const sanitizedMessage = data.text;
                console.log("data:", data);
              });
            }}
          >
            Sing up user
          </LoadingButton>
          <LoadingButton
            onClick={async () => {
              const addMessage = httpsCallable(functions, "resetPasswords");
              addMessage({ text: "Test super function" }).then((result) => {
                // Read result of the Cloud Function.
                /** @type {any} */
                const data: any = result.data;
                //const sanitizedMessage = data.text;
                console.log("data:", data);
              });
            }}
          >
            Reset all passwords
          </LoadingButton>
          <LoadingButton
            onClick={async () => {
              const addMessage = httpsCallable(functions, "signUpUser");
              addMessage({
                email: "henri.pihet@protonmail.com",
                displayName: "kiki2000",
              }).then((result) => {
                // Read result of the Cloud Function.
                /** @type {any} */
                const data: any = result.data;
                //const sanitizedMessage = data.text;
                console.log("data:", data);
              });
            }}
          >
            Signup user
          </LoadingButton>
        </CardContent>
      </Card>
    </>
  );
}
