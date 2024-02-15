import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import {CardContent} from "@mui/material";
import {useAuth} from "../../auth/AuthProvider";

import {DocumentData} from "@firebase/firestore";
import NewComitard from "../admin-account/new_comitard";
import Table from "@mui/material/Table";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";

interface AccountProps {
    data: DocumentData;
    refetchData: () => void;
}


export default function Account({data, refetchData}: AccountProps) {
    const {user} = useAuth();

    console.log(data.data())
    console.table(data.data().cercles[user?.uid].comitards)

    const comitards = data.data().cercles[user?.uid].comitards;
    return (
        <>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                mb={5}
            >
                <Typography variant="h4" sx={{mb: 1}}>
                    Bonjour, bienvenue {user && user?.displayName}! 👋
                </Typography>
            </Stack>

            <NewComitard data={data} admin={false} refetchData={refetchData}/>

            <Card sx={{width: "100%", mb: 4}}>
                <CardContent>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Prénom</TableCell>
                                    <TableCell>Nom</TableCell>
                                    <TableCell>Surnom</TableCell>
                                    <TableCell>Début de l'enchère</TableCell>
                                    <TableCell>Fin de l'enchère</TableCell>

                                    <TableCell>Poste</TableCell>
                                    <TableCell>Teneur en taule</TableCell>
                                    <TableCell>État civil</TableCell>
                                    <TableCell>Âge</TableCell>
                                    <TableCell>Nombre d'★</TableCell>
                                    <TableCell>Point fort</TableCell>
                                    <TableCell>Point faible</TableCell>
                                    <TableCell>Est le seul</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Object.keys(comitards).map((key) => (
                                    <TableRow key={key}>
                                        <TableCell>{comitards[key].firstname}</TableCell>
                                        <TableCell>{comitards[key].name}</TableCell>
                                        <TableCell>{comitards[key].nickname}</TableCell>
                                        <TableCell>{comitards[key].enchereStart ? comitards[key].enchereStart.toDate().toLocaleString() : "N/A"}</TableCell>
                                        <TableCell>{comitards[key].enchereStop ? comitards[key].enchereStop.toDate().toLocaleString() : "N/A"}</TableCell>
                                        <TableCell>{comitards[key].post}</TableCell>
                                        <TableCell>{comitards[key].teneurTaule}</TableCell>
                                        <TableCell>{comitards[key].etatCivil}</TableCell>
                                        <TableCell>{comitards[key].age}</TableCell>
                                        <TableCell>{comitards[key].nbEtoiles}</TableCell>
                                        <TableCell>{comitards[key].pointFort}</TableCell>
                                        <TableCell>{comitards[key].pointFaible}</TableCell>
                                        <TableCell>{comitards[key].estLeSeul}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            <Card sx={{width: "100%", mb: 4}}>
                <CardContent>
                    Table with all encheres made by the cercle
                </CardContent>
            </Card>

            <Card sx={{width: "100%", mb: 4}}>
                <CardContent>
                    Option to reset password
                </CardContent>
            </Card>

        </>
    );
}
