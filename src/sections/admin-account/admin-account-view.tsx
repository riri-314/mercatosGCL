import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import { Box, CardContent, Grid, TextField } from "@mui/material";
import { useAuth } from "../../auth/AuthProvider";
import { LoadingButton } from "@mui/lab";
import {
  addCercle,
  editEdition,
  newComitard,
  newEdition,
  removeComitard,
} from "../../utils/admin-tools";
import { useState } from "react";
import { DocumentData } from "@firebase/firestore";
import Alert, { AlertColor } from "@mui/material/Alert";
import {
  getAuth,
  sendPasswordResetEmail,
//  updatePassword,
} from "@firebase/auth";
//import firebase from "@firebase/app";
import { getFunctions, httpsCallable } from "@firebase/functions";

interface AdminAccountProps {
  data: DocumentData;
  id: string;
}

export default function AdminAccount({ data, id }: AdminAccountProps) {
  const user = useAuth();
  const [newEditionLoading, setNewEditionLoading] = useState(false);
  const [editEditionLoading, setEditEditionLoading] = useState(false);
  const [newComiatrdLoading, setNewComitardLoading] = useState(false);
  const [removeComiatrdLoading, setRemoveComitardLoading] = useState(false);

  const [cercleDescription, setCercleDescription] = useState<string>("");
  const [cercleName, setCercleName] = useState<string>("");
  const [cercleError, setCercleError] = useState<string>("");
  const [cercleErrorSeverity, setCercleErrorSeverity] = useState<
    AlertColor | undefined
  >("error");

  function handleNewCercle() {
    setCercleError("");
    setCercleErrorSeverity("error");
    console.log(cercleDescription);
    console.log(cercleName);
    if (cercleName === "") {
      setCercleError("Le nom du cercle ne peut pas être vide");
      return;
    } else {
      //create cercle
      try {
        addCercle(
          id,
          { name: cercleName, description: cercleDescription },
          data.votes
        );
        setCercleError("Succes !");
        setCercleErrorSeverity("success");
      } catch {
        setCercleError("Erreur inconnue. Contacte l'administrateur");
      }
    }
  }

  const callableHelloWorld = httpsCallable(getFunctions(), "sayHello");

  async function callHelloWorld(data: any) {
    callableHelloWorld(data)
      .then((result) => {
        // Handle the result from the cloud function
        console.log(result.data);
      })
      .catch((error) => {
        // Handle any errors
        console.error(error);
      });
  }

  

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

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          Create new event {"->"} add cercle ? {"->"} start and stop dates{" "}
          {"->"} edit description ? (precise that start and stop dates are shown
          by default) <br />
          Table listing events and which one is active <br />
        </CardContent>
      </Card>
      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Créer nouveau cercle
          </Typography>
          Need to create new account for each cercle and set display name <br />
          <Box component="form" noValidate autoComplete="off">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Nom du cercle"
                  fullWidth
                  onChange={(e) => setCercleName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Description"
                  multiline
                  maxRows={4}
                  fullWidth
                  onChange={(e) => {
                    setCercleDescription(e.target.value);
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <LoadingButton
                  size="large"
                  variant="contained"
                  fullWidth
                  onClick={() => handleNewCercle()}
                >
                  Créer cercle
                </LoadingButton>
              </Grid>
            </Grid>
          </Box>
          {cercleError && (
            <Alert sx={{ mt: 3 }} severity={cercleErrorSeverity}>
              {cercleError}
            </Alert>
          )}
        </CardContent>
      </Card>

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

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          Add/Edit/Remove comitard <br />
        </CardContent>
      </Card>

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          Debug card <br />
          Init db <br />
          <LoadingButton
            loading={newEditionLoading}
            onClick={async () => {
              setNewEditionLoading(true);
              await newEdition(
                "ddd",
                new Date("2022-03-25"),
                new Date("2022-03-30"),
                100
              );
              setNewEditionLoading(false);
            }}
          >
            New edition
          </LoadingButton>
          <LoadingButton
            loading={editEditionLoading}
            onClick={async () => {
              setEditEditionLoading(true);
              await editEdition("Tq3co1gQYRzW6cgNsXK0", {
                name: "test",
                start: new Date("2022-03-25"),
                end: new Date("2022-03-30"),
                maxComitards: 100,
              });
              setEditEditionLoading(false);
            }}
          >
            Edit edition
          </LoadingButton>
          <LoadingButton
            loading={newComiatrdLoading}
            onClick={async () => {
              setNewComitardLoading(true);
              await newComitard("Tq3co1gQYRzW6cgNsXK0", {
                name: "test",
                email: "fff",
              });
              setNewComitardLoading(false);
            }}
          >
            New comitard
          </LoadingButton>
          <LoadingButton
            loading={removeComiatrdLoading}
            onClick={async () => {
              setRemoveComitardLoading(true);
              await removeComitard(
                "Tq3co1gQYRzW6cgNsXK0",
                "85Xzv2z95pKp1vomfwq3"
              );
              setRemoveComitardLoading(false);
            }}
          >
            Remove comitard
          </LoadingButton>
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
              try {
                const result: any = await callHelloWorld({thing: "thing"});
                console.log(result.data.output);
              } catch (error) {
                console.log(`error: ${JSON.stringify(error)}`);
              }
            }}
          >
            Cloud function
          </LoadingButton>
        </CardContent>
      </Card>
    </>
  );
}
