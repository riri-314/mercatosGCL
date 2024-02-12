import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import { Button, CardContent, Modal } from "@mui/material";
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

interface AdminAccountProps {
  data: DocumentData[];
  refetchData: () => void;
  activeData: DocumentData;
}

export default function AdminAccount({ data, refetchData, activeData }: AdminAccountProps) {
  const { user } = useAuth();
  
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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

      <NewEdition data={activeData} refetchData={refetchData} />

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Éditer édition
          </Typography>
          <QuickFilteringGrid data={data}/>
        </CardContent>
      </Card>

      <NewCerle refetchData={refetchData} />

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Éditer, supprimer cercle
          </Typography>
          Table with cercle data. Column with edit button and delete button{" "}
          <br />
          Delete button raise a generic warning pop up and also delete the user
          login <br />
          Edit button raise a edit form in form of a modal, change email adress{" "}
          <br />
          Let change the fut count
        </CardContent>
      </Card>
      <Button onClick={handleOpen}>Open modal</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{
          m: 3,
          overflow:'scroll',
          maxWidth: 800,
          ml: "auto",
          mr: "auto",
        }}
      >
        <NewComitard data={activeData} admin={true} refetchData={refetchData} />
      </Modal>

      <NewComitard data={activeData} admin={true} refetchData={refetchData} />

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          Edit/Remove comitard <br />
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
