import { useRef } from "react";
import { Helmet } from "react-helmet-async";
import Container from "@mui/material/Container";
import type { DocumentData } from "firebase/firestore";
import AdminAccount from "../sections/admin-account/admin-account-view";
import Loading from "../sections/loading/loading";
import { useData } from "../data/data-context";
import { useEditionHistory } from "../data/use-edition-history";

export default function AdminAccountPage() {
  const { data } = useData();
  const history = useEditionHistory();
  // Keep the controls available during the brief gap in an edition transition.
  const lastActive = useRef<DocumentData | null>(null);
  if (data) lastActive.current = data;
  const activeData = data ?? lastActive.current;

  return <Container maxWidth="xl">
    <Helmet><title>Compte</title></Helmet>
    {activeData
      ? <AdminAccount history={history} refetchData={history.refresh} activeData={activeData} />
      : <Loading />}
  </Container>;
}
