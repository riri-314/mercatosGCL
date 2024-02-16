import Card from "@mui/material/Card";
import {Accordion, AccordionDetails, AccordionSummary, CardContent} from "@mui/material";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Typography from "@mui/material/Typography";
import LazyLoad from "react-lazy-load";
import Box from "@mui/material/Box";

interface MyComitardsProps {
    comitards: Record<string, Comitard>;
}

interface Comitard {
    firstname: string;
    name: string;
    nickname: string;
    enchereStart: any;
    enchereStop: any;
    post: string;
    teneurTaule: string;
    etatCivil: string;
    age: string;
    nbEtoiles: string;
    pointFort: string;
    pointFaible: string;
    estLeSeul: string;

}

export const MyComitards = (comitardsProps: MyComitardsProps) => {
    const comitards = comitardsProps.comitards;

    const renderImg = (comitard : Comitard) => (
        <LazyLoad>
            <Box
                component="img"
                alt={comitard.name}
                src={comitard.picture}
                sx={{
                    width: (theme) => `${theme.spacing(10)}`,
                    minWidth: (theme) => `${theme.spacing(10)}`,
                    height: (theme) => `${theme.spacing(10)}`,
                    objectFit: "cover",
                }}
                loading="lazy"
            />
        </LazyLoad>
    );

    return (
        <>
            <Card sx={{width: "100%", mb: 4}}>
                <CardContent>
                    <Accordion>
                        <AccordionSummary expandIcon={<Typography variant="h3">🢃</Typography>}>
                            <Typography variant="h5">Mes comitards</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Photo</TableCell>
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
                                        {comitards && Object.keys(comitards).map((key) => (
                                            <TableRow key={key}>
                                                <TableCell>{renderImg(comitards[key])}</TableCell>
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
                        </AccordionDetails>
                    </Accordion>
                </CardContent>
            </Card>
        </>
    )
        ;
};