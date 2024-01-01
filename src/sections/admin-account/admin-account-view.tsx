import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import { CardContent } from "@mui/material";
import { useAuth } from "../../auth/AuthProvider";
import { LoadingButton } from "@mui/lab";
import { DocumentData } from "@firebase/firestore";
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

interface AdminAccountProps {
  data: DocumentData;
  id: string;
}

export default function AdminAccount({ data, id }: AdminAccountProps) {
  const user = useAuth();

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
      >
        <Typography variant="h4" sx={{ mb: 1 }}>
          Hi, Welcome back {user && user?.email} 👋
        </Typography>
      </Stack>

      <NewEdition data={data} id={id} />

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Éditer édition
          </Typography>
          Table with edition data. Column with edit button <br />
          Edit button raise a edit form in form of a modal <br />
          Star ion to indicate the current active edition <br />
        </CardContent>
      </Card>

      <NewCerle data={data} id={id} />

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
        </CardContent>
      </Card>

      <NewComitard />

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          Edit/Remove comitard <br />
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
