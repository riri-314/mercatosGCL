import { Helmet } from 'react-helmet-async';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Container from '@mui/material/Container';

import UserTable from 'src/sections/results/results-view';

// ----------------------------------------------------------------------

export default function ResultsPage() {
  return (
    <>
    <Container maxWidth="xl">

      <Helmet>
        <title> Résultats </title>
      </Helmet>
      <Grid container spacing={3}>
        <Grid xs={12} md={6} lg={6}>
          <UserTable tableName="Enchères en cours" columnName="Temps restant"/>
        </Grid>
        <Grid xs={12} md={6} lg={6}>
          <UserTable tableName="Enchères remportées" columnName="Fin de l'enchère"/>
        </Grid>
        <Grid xs={12} md={6} lg={6}>
          <UserTable tableName="Toutes les enchères" columnName="Date de l'enchère"/>
        </Grid>
      </Grid>
    </Container>
    </>
  );
}
