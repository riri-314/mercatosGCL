import {Helmet} from 'react-helmet-async';
import Container from '@mui/material/Container';
import ResultsPage from '../sections/results/results';


// ----------------------------------------------------------------------

export default function RulesPage() {
    return (<>
            <Container maxWidth="xl">

                <Helmet>
                    <title> Résultats </title>
                </Helmet>

                <ResultsPage/>
            </Container>
        </>);
}
