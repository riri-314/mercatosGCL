import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";

import { CardContent, Modal, Alert } from "@mui/material";
import { useAuth } from "../../auth/AuthProvider";

import { DocumentData } from "@firebase/firestore";
import NewComitard from "../admin-account/new_comitard";
import ComitardTable from "../admin-account/comitard_table.tsx";
import { getAuth, sendPasswordResetEmail } from "@firebase/auth";
import { LoadingButton } from "@mui/lab";
import Box from "@mui/material/Box";

import { useState } from "react";
import EditComitard from "../admin-account/edit_comitard";
import { httpsCallable } from "@firebase/functions";
import { functions } from "../../firebase_config.ts";
import EncheresTable from "../admin-account/enchere_table.tsx";

interface AccountProps {
  data: DocumentData;
  refetchData: () => void;
}

export default function Account({ data, refetchData }: AccountProps) {
  const { user } = useAuth();

  const [errorComitardEdit, setErrorComitardEdit] = useState("");
  const [openModalComitard, setOpenModalComitard] = useState(false);
  const [modalComitardData, setModalComitardData] = useState<any | null>(null);
  console.log("now: ", new Date().getTime());
  console.log("stop: ", data?.data().stop.toDate().getTime());
  console.log(
    "test: ",
    new Date().getTime() < data?.data().stop.toDate().getTime()
  );

  function getNbComitard(): [boolean, number, boolean, any] {
    // it return [did the function work (error?), number of comitard left, can the user add a comitard]
    if (user) {
      try {
        const cercleData = data?.data().cercles;
        const nbComitard = Object.keys(
          cercleData[user?.uid]["comitards"]
        ).length;
        const maxComitards = data?.data().nbComitard;
        const nbComitardsLeft = maxComitards - nbComitard;
        if (nbComitardsLeft < 0) {
          return [true, 0, false, ""];
        } else {
          return [true, nbComitardsLeft, true, ""];
        }
      } catch (error: any) {
        return [false, 0, true, error];
      }
    } else {
      console.log("no user");
      return [false, 0, true, "no user"];
    }
  }

  function element() {
    if (new Date().getTime() < data?.data().stop.toDate().getTime()) {
      if (getNbComitard()[0] && getNbComitard()[2]) {
        //function is ok and comitards left
        if (new Date().getTime() < data?.data().start.toDate().getTime()) {
          return (
            <>
              <Alert severity="info" sx={{ mb: 4 }}>
                Créez votre comitard avant le début des enchères{" "}
                {data?.data().start.toDate().toLocaleString()}
                <br />
                il vous reste jusqu'a {getNbComitard()[1]} comitards à créer
              </Alert>
              <NewComitard
                data={data}
                admin={false}
                refetchData={refetchData}
              />
            </>
          );
        } else {
          return (
            <>
              <Alert severity="warning" sx={{ mb: 4 }}>
                {" "}
                Vous pouvez toujours créer un comitard mais les enchères ont
                déja commencées depuis le{" "}
                {data?.data().start.toDate().toLocaleString()}
                <br />
                il vous reste jusqu'a {getNbComitard()[1]} comitards à créer
              </Alert>
              <NewComitard
                data={data}
                admin={false}
                refetchData={refetchData}
              />
            </>
          );
        }
      } else if (getNbComitard()[0] && !getNbComitard()[2]) {
        return (
          <Card sx={{ width: "100%", mb: 4, p: 2 }}>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 1 }}>
                Plus moyen de créer un comitard! Vous avez atteint le nombre
                maximum de comitards
              </Typography>
            </CardContent>
          </Card>
        );
      } else {
        return (
          <Card sx={{ width: "100%", mb: 4, p: 2 }}>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 1 }}>
                Pas moyen de créer un comitard! Erreur:{" "}
                {String(getNbComitard()[3])}
              </Typography>
            </CardContent>
          </Card>
        );
      }
    } else {
      return (
        <Card sx={{ width: "100%", mb: 4, p: 2 }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 1 }}>
              Plus moyen de créer un comitard! Les enchères sont terminées
            </Typography>
          </CardContent>
        </Card>
      );
    }
  }

  // in time
  // comitards left
  // before enchere
  // between enchere
  // no comitards left
  // not in time

  //getNbComitard();
  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
      >
        <Typography variant="h4" sx={{ mb: 1 }}>
          Bonjour, bienvenue {user && user?.displayName} 👋
        </Typography>
      </Stack>
      {element()}
      <Card sx={{ width: "100%", mb: 4, p: 2 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Éditer comitard
          </Typography>
          <ComitardTable
            data={data}
            refetchData={refetchData}
            admin={false}
            error={(error) => setErrorComitardEdit(error)}
            handleOpenModalComitard={(data: any) => {
              setOpenModalComitard(true);
              setModalComitardData(data);
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
        <EditComitard
          refetchData={refetchData}
          ComitardData={modalComitardData}
          activeData={data}
          close={() => setOpenModalComitard(false)}
          admin={false}
        />
      </Modal>

      <Card sx={{ width: "100%", mb: 4, p: 2 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Mes enchère
          </Typography>
          <EncheresTable
            data={data}
            admin={false}
            refetchData={refetchData}
            error={(error) => console.log("error: ", error)}
            handleOpenModalEnchere={(data: any) => {
              console.log("data open modale: ", data);
            }}
          />
        </CardContent>
      </Card>

      <Card sx={{ width: "100%", mb: 4, p: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Paramètres du compte</Typography>
            <Box>
              <LoadingButton
                size="large"
                variant={"outlined"}
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
                Réinitialiser le mot de passe
              </LoadingButton>
            </Box>
            <LoadingButton
              variant={"outlined"}
              size={"large"}
              onClick={async () => {
                const addMessage = httpsCallable(functions, "votebis");
                addMessage({ clientTime: new Date().toISOString() }).then(
                  (result) => {
                    const data: any = result.data;
                    console.log("Retunr message:", data);
                  }
                );
              }}
            >
              DEBUG VOTE
            </LoadingButton>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
