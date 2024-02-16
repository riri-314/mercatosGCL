import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";

import {Accordion, AccordionDetails, AccordionSummary, CardContent, Modal, Alert} from "@mui/material";
import {useAuth} from "../../auth/AuthProvider";

import {DocumentData} from "@firebase/firestore";
import NewComitard from "../admin-account/new_comitard";
import ComitardTable from "../admin-account/comitard_table.tsx";
import Container from "@mui/material/Container";
import {getAuth, sendPasswordResetEmail} from "@firebase/auth";
import {LoadingButton} from "@mui/lab";
import Box from "@mui/material/Box";

import { useState } from "react";
import EditComitard from "../admin-account/edit_comitard";



interface AccountProps {
    data: DocumentData;
    refetchData: () => void;
}


export default function Account({ data, refetchData }: AccountProps) {
  const { user } = useAuth();

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
          Hi, Welcome back {user && user?.displayName} 👋
        </Typography>
      </Stack>

      <NewComitard data={data} admin={false} refetchData={refetchData} />

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
          data={modalComitardData}
          activeData={data}
          close={() => setOpenModalComitard(false)}
          admin={false}
        />
      </Modal>
      
        <Card sx={{width: "100%", mb: 4}}>
            <CardContent>
                <Accordion>
                    <AccordionSummary expandIcon={<Typography variant="h3">🢃</Typography>}>
                        <Typography variant="h5">Enchères posées</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Container>
                            <Typography variant="h6" align="center">
                                Coming soon !
                            </Typography>
                        </Container>
                    </AccordionDetails>
                </Accordion>
            </CardContent>
        </Card>
      
              <Card sx={{width: "100%", mb: 4, p: 2}}>
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
                </Stack>
            </CardContent>
        </Card>
    </>
  );
}
