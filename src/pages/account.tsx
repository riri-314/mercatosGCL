import { Helmet } from "react-helmet-async";
import Container from "@mui/material/Container";
import Loading from "../sections/loading/loading";
import { DocumentData } from "@firebase/firestore";
import Account from "../sections/account/account-view";
import { useData } from "../data/DataProvider";

// ----------------------------------------------------------------------
interface DataContextValue {
  data: DocumentData | null;
  refetchData: () => void;
}

export default function AccountPage() {
  const { data, refetchData } = useData() as DataContextValue;

  //load doc from firebase then display account
  return (
    <>
      <Container maxWidth="xl">
        <Helmet>
          <title> Compte </title>
        </Helmet>
        {data ? <Account data={data} refetchData={refetchData} /> : <Loading />}
      </Container>
    </>
  );
}
