import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import {Accordion, AccordionDetails, AccordionSummary, CardContent} from "@mui/material";
import {useAuth} from "../../auth/AuthProvider";

import {DocumentData} from "@firebase/firestore";
import NewComitard from "../admin-account/new_comitard";
import ComitardTable from "../admin-account/comitard_table.tsx";
import Container from "@mui/material/Container";
import {getAuth, sendPasswordResetEmail} from "@firebase/auth";
import {LoadingButton} from "@mui/lab";
import Box from "@mui/material/Box";

interface AccountProps {
    data: DocumentData;
    refetchData: () => void;
}


export default function Account({data, refetchData}: AccountProps) {
    const {user} = useAuth();

    return (<>
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={5}
        >
            <Typography variant="h4" sx={{mb: 1}}>
                Hi, Welcome back {user && user?.displayName} 👋
            </Typography>
        </Stack>

        <NewComitard data={data} admin={false} refetchData={refetchData}/>

        <Card sx={{width: "100%", mb: 4}}>
            <CardContent>
                <Typography variant="h5" sx={{mb: 1}}>
                    Éditer comitard
                </Typography>
                <ComitardTable
                    data={data}
                    refetchData={refetchData}
                    admin={false}
                    error={(error) => console.log("error: ", error)}
                    handleOpenModalComitard={(data: any) => {
                        console.log("modal open:", data);
                    }}
                />
            </CardContent>
        </Card>

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

    </>);
}
