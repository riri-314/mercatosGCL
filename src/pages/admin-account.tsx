import { Helmet } from "react-helmet-async";
import Container from "@mui/material/Container";
import AdminAccount from "../sections/admin-account/admin-account-view";
import { useData } from "../data/DataProvider";
import Loading from "../sections/loading/loading";

// ----------------------------------------------------------------------

export default function AdminAccountPage() {
  const { data, refetchData } = useData() ;

  return (
    <>
      <Container maxWidth="xl">
        <Helmet>
          <title> Compte </title>
        </Helmet>
        {data ? <AdminAccount data={data} refetchData={refetchData}/> : <Loading />}
      </Container>
    </>
  );
}
