import {Helmet} from "react-helmet-async";
import Grid from "@mui/material/Unstable_Grid2";
import Container from "@mui/material/Container";
import ResultTable from "../sections/results/results-view";

// ----------------------------------------------------------------------

export default function ResultsPage() {
    return (<>
            <Container maxWidth="xl">
                <Helmet>
                    <title> Résultats </title>
                </Helmet>
                <Grid container spacing={3}>
                    <Grid xs={12} md={6} lg={6}>
                        <ResultTable
                            tableName="Enchères en cours"
                            columnName={[{id: "name", label: "Nom"}, {id: "enchere", label: "Enchère"}, {
                                id: "date",
                                label: "Temps restant"
                            },]}
                        />
                    </Grid>
                    <Grid xs={12} md={6} lg={6}>
                        <ResultTable
                            tableName="Enchères remportées"
                            columnName={[{id: "name", label: "Nom"}, {id: "enchere", label: "Enchère"}, {
                                id: "date",
                                label: "Fin de l'enchère"
                            },]}
                        />
                    </Grid>
                    <Grid xs={12} md={6} lg={6}>
                        <ResultTable
                            tableName="Toutes les enchères"
                            columnName={[{id: "name", label: "Nom"}, {id: "enchere", label: "Enchère"}, {
                                id: "date",
                                label: "Date de l'enchère"
                            },]}
                        />
                    </Grid>
                </Grid>
            </Container>
        </>);
}
