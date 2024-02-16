import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import {CardContent} from "@mui/material";
import {useAuth} from "../../auth/AuthProvider";

import {DocumentData} from "@firebase/firestore";
import NewComitard from "../admin-account/new_comitard";
import {MyComitards} from "./my_comitards.tsx";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";

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

            <MyComitards comitards={comitards}/>

            <Card sx={{width: "100%", mb: 4}}>
                <CardContent>
                    enchères
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
