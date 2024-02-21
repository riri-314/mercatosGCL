import {Helmet} from "react-helmet-async";
import Grid from "@mui/material/Unstable_Grid2";
import Container from "@mui/material/Container";
import {useData} from "../data/DataProvider.tsx";
import {Timestamp} from "@firebase/firestore";
import {DataGrid} from "@mui/x-data-grid";
import {CardContent, CardHeader} from "@mui/material";
import Card from "@mui/material/Card";
import React from "react";

// ----------------------------------------------------------------------

export default function ResultsPage() {

    const {data, refetchData, fetchedTime} = useData();

    function getCerclesDataWithNames() {
        const cerclesWithNames = {};

        Object.keys(data?.data().cercles).forEach((cercleId) => {
            cerclesWithNames[cercleId] = {name: data?.data().cercles[cercleId].name};
        });

        return cerclesWithNames;
    }

    // aggregate the encheres from the data
    function aggregateAllEncheres() {
        const encheres = [];
        if (data?.data()) {
            for (const cercle_id in data.data().cercles) {
                const cercle = data.data().cercles[cercle_id];
                if (cercle.comitards) {
                    for (const comitard_id in cercle.comitards) {
                        const comitard = cercle.comitards[comitard_id];
                        if (comitard.encheres) {
                            for (const enchere_id in comitard.encheres) {
                                const enchere = comitard.encheres[enchere_id];

                                const date = enchere.date as Timestamp;

                                encheres.push({
                                    id: enchere_id,
                                    comitard: `${comitard.name} "${comitard.nickname}" ${comitard.firstname}`,
                                    enchere: `${getCerclesDataWithNames()[enchere.sender]?.name || 'Erreur'} avec ${enchere.vote} fûts`,
                                    vote: enchere.vote,
                                    date: date.toDate().toLocaleString(),
                                })
                            }
                        }
                    }
                }
            }
        }
        encheres.sort((a, b) => {
            if (a.date > b.date) {
                return -1;
            }
            if (a.date < b.date) {
                return 1;
            }
            return 0;
        });

        return encheres;
    }

    // aggregate the running encheres
    function aggregateRunningEncheres() {
        const encheres = [];
        if (data?.data()) {
            for (const cercle_id in data.data().cercles) {
                const cercle = data.data().cercles[cercle_id];
                if (cercle.comitards) {
                    for (const comitard_id in cercle.comitards) {
                        const comitard = cercle.comitards[comitard_id];
                        if (comitard.encheres) {
                            const startEncheres = comitard.enchereStart as Timestamp;
                            const endEncheres = comitard.enchereStop as Timestamp;
                            if (endEncheres.toDate() > Date.now() && startEncheres.toDate() < Date.now()) {
                                const candidateEncheres = [];
                                for (const enchere_id in comitard.encheres) {
                                    const enchere = comitard.encheres[enchere_id];
                                    const date = enchere.date as Timestamp;
                                    candidateEncheres.push({
                                        id: enchere_id,
                                        comitard: `${comitard.name} "${comitard.nickname}" ${comitard.firstname}`,
                                        enchere: `${getCerclesDataWithNames()[enchere.sender]?.name || 'Erreur'} avec ${enchere.vote} fûts`,
                                        vote: enchere.vote,
                                        endDate: endEncheres.toDate().toLocaleString(),
                                    });
                                }

                                candidateEncheres.sort((a, b) => {
                                    if (a.vote > b.vote) {
                                        return -1;
                                    }
                                    if (a.vote < b.vote) {
                                        return 1;
                                    }
                                    if (a.endDate > b.endDate) {
                                        return -1;
                                    }
                                    if (a.endDate < b.endDate) {
                                        return 1;
                                    }
                                    return 0;
                                });

                                encheres.push(candidateEncheres[0]);
                            }
                        }
                    }
                }
            }
        }
        encheres.sort((a, b) => {
            if (a.endDate < b.endDate) {
                return -1;
            }
            if (a.endDate > b.endDate) {
                return 1;
            }
            return 0;
        });
        return encheres;
    }

    // aggregate the closed encheres
    function aggregateClosedEncheres() {
        const encheres = [];
        if (data?.data()) {
            for (const cercle_id in data.data().cercles) {
                const cercle = data.data().cercles[cercle_id];
                if (cercle.comitards) {
                    for (const comitard_id in cercle.comitards) {
                        const comitard = cercle.comitards[comitard_id];
                        if (comitard.encheres) {
                            const startEncheres = comitard.enchereStart as Timestamp;
                            const endEncheres = comitard.enchereStop as Timestamp;
                            if (endEncheres.toDate() < Date.now() && startEncheres.toDate() < Date.now()) {
                                const candidateEncheres = [];
                                for (const enchere_id in comitard.encheres) {
                                    const enchere = comitard.encheres[enchere_id];
                                    const date = enchere.date as Timestamp;
                                    candidateEncheres.push({
                                        id: enchere_id,
                                        comitard: `${comitard.name} "${comitard.nickname}" ${comitard.firstname}`,
                                        enchere: `${getCerclesDataWithNames()[enchere.sender]?.name || 'Erreur'} avec ${enchere.vote} fûts`,
                                        vote: enchere.vote,
                                        endDate: endEncheres.toDate().toLocaleString(),
                                    });
                                }

                                candidateEncheres.sort((a, b) => {
                                    if (a.vote > b.vote) {
                                        return -1;
                                    }
                                    if (a.vote < b.vote) {
                                        return 1;
                                    }
                                    if (a.endDate > b.endDate) {
                                        return -1;
                                    }
                                    if (a.endDate < b.endDate) {
                                        return 1;
                                    }
                                    return 0;
                                });

                                encheres.push(candidateEncheres[0]);
                            }
                        }
                    }
                }
            }
        }
        encheres.sort((a, b) => {
            if (a.endDate < b.endDate) {
                return -1;
            }
            if (a.endDate > b.endDate) {
                return 1;
            }
            return 0;
        });
        console.log(encheres);
        return encheres;
    }


    return (<>
        <Container maxWidth="xl">
            <Helmet>
                <title> Résultats </title>
            </Helmet>
            <Grid container spacing={3}>
                {/*<Grid xs={12} md={6} lg={6}>
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
                </Grid>*/}
                {/*<Grid xs={12} md={6} lg={6}>
                    <ResultTable
                        encheres={aggregateEncheres()}
                        tableName="Enchères en cours"
                        columnName={[
                            {id: "name", label: "Comitard"},
                            {id: "enchere", label: "Enchères"},
                            {id: "date", label: "Fin de l'enchère"},
                        ]}
                    />
                </Grid>*/}
                <Grid xs={12} md={6} xl={6}>
                    <Card >
                        <CardHeader title={"Enchères en cours"}/>
                        <CardContent>
                            <DataGrid
                                sx={{minHeight: "46rem"}}
                                rows={aggregateRunningEncheres()}
                                columns={[
                                    {field: 'comitard', headerName: 'Comitard', sortable: false, width: 200},
                                    {field: 'enchere', headerName: 'Meilleure enchère', sortable: false, width: 200},
                                    {field: 'endDate', headerName: "Fin des enchères", sortable: false, width: 200},]}
                                initialState={{
                                    pagination: {
                                        paginationModel: {page: 0, pageSize: 12},
                                    },
                                }}
                                pageSizeOptions={[12, 30, 50]}
                                disableColumnMenu
                            />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid xs={12} md={6} xl={6}>
                    <Card>
                        <CardHeader title={"Enchères remportées"}/>
                        <CardContent>
                            <DataGrid
                                sx={{minHeight: "46rem"}}
                                rows={aggregateClosedEncheres()}
                                columns={[
                                    {field: 'comitard', headerName: 'Comitard', sortable: false, width: 250},
                                    {field: 'enchere', headerName: 'Gagnant', sortable: false, width: 150},
                                    {field: 'endDate', headerName: "Enchères terminées à", sortable: false, width: 200},]}
                                initialState={{
                                    pagination: {
                                        paginationModel: {page: 0, pageSize: 12},
                                    },
                                }}
                                pageSizeOptions={[12, 30, 50]}
                                disableColumnMenu
                            />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid xs={12} lg={6}>
                    <Card>
                        <CardHeader title={"Toutes les enchères"}/>
                        <CardContent>
                            <DataGrid
                                sx={{minHeight: "46rem"}}
                                rows={aggregateAllEncheres()}
                                columns={[
                                    {field: 'comitard', headerName: 'Comitard', sortable: false, width: 200},
                                    {field: 'enchere', headerName: 'Meilleure enchère', sortable: false, width: 200},
                                    {field: 'date', headerName: "Date de l'enchère", sortable: false, width: 200},]}
                                initialState={{
                                    pagination: {
                                        paginationModel: {page: 0, pageSize: 12},
                                    },
                                }}
                                pageSizeOptions={[12, 30, 50]}
                                disableColumnMenu
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    </>);
}
