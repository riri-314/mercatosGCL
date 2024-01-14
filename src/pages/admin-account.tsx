import { Helmet } from "react-helmet-async";
import Container from "@mui/material/Container";
import AdminAccount from "../sections/admin-account/admin-account-view";
import { useData } from "../data/DataProvider";
import { DocumentData } from "@firebase/firestore";
import Loading from "../sections/loading/loading";

// ----------------------------------------------------------------------

interface DataContextValue {
  data: DocumentData | null;
  refetchData: () => void;
}

export default function AdminAccountPage() {
  const { data, refetchData } = useData() as DataContextValue;

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
