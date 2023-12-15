import { Helmet } from 'react-helmet-async';
import Container from '@mui/material/Container';
import Account from 'src/sections/account/account-view';


// ----------------------------------------------------------------------

export default function AccountPage() {
  return (
    <>
    <Container maxWidth="xl">

      <Helmet>
        <title> Compte </title>
      </Helmet>

      <Account/>

    </Container>
    </>
  );
}
