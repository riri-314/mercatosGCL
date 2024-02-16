import {Helmet} from 'react-helmet-async';
import Container from '@mui/material/Container';
import Rules from '../sections/rules/rules-view';


// ----------------------------------------------------------------------

export default function RulesPage() {
    return (<>
            <Container maxWidth="xl">

                <Helmet>
                    <title> Règlement </title>
                </Helmet>

                <Rules/>
            </Container>
        </>);
}
