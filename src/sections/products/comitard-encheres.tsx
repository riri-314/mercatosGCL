import {Timestamp} from "@firebase/firestore";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import Paper from "@mui/material/Paper";
import {Typography} from "@mui/material";
import Iconify from "../../components/iconify/iconify.tsx";
import Stack from "@mui/material/Stack";

interface Encheres {
    date: Timestamp;
    sender: string;
    vote: number;
}

interface CerclesData {
    [key: string]: { name: string };
}

interface EncheresListProps {
    encheres: { [key: string]: Encheres } | null;
    cerclesData: CerclesData;
    won: boolean;
}

const EncheresList: React.FC<EncheresListProps> = ({encheres, cerclesData, won}) => {
    if (encheres === null || encheres == undefined) {
        return <h3>Il n'y a pas encore d'enchère sur ce comitard</h3>;
    }
    return (<div>
            <h3>Historique des enchères :</h3>
            <TableContainer component={Paper}>
                <Table>
                    <caption>Toutes les enchères sont listées ici.</caption>
                    <TableHead>
                        <TableRow>
                            <TableCell><Typography variant="subtitle1">Cercle enchérisseur</Typography></TableCell>
                            <TableCell><Typography variant="subtitle1">Date</Typography></TableCell>
                            <TableCell><Typography variant="subtitle1">Enchère</Typography></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(encheres)
                            .sort(([, a], [, b]) => b.date.seconds - a.date.seconds)
                            .map(([id, encheresData], index) => (<TableRow
                                    key={index}
                                    sx={{backgroundColor: (theme) => index === 0 ? `${theme.palette.info.lighter}` : ''}}
                                >
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            {won && index === 0 && <Iconify icon="solar:cup-bold"/>}
                                            <strong>{cerclesData[encheresData.sender]?.name || 'Erreur'}</strong>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>{encheresData.date.toDate().toLocaleString()}</TableCell>
                                    <TableCell>{encheresData.vote}</TableCell>
                                </TableRow>))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>);
};

export default EncheresList;