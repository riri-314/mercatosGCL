import { Helmet } from "react-helmet-async";
import Container from "@mui/material/Container";
import Loading from "../sections/loading/loading";
import { db } from "../firebase_config";
import { useEffect, useState } from "react";
import {
  DocumentData,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "@firebase/firestore";
import Account from "../sections/account/account-view";

// ----------------------------------------------------------------------

export default function AccountPage() {
  const [data, setData] = useState<DocumentData | null>(null);
  //const navigation = useNavigation();
  
  useEffect(() => {
    const fetchData = async () => {
      console.log("Fetched data")
      const editionsRef = collection(db, "editions");

      const queryDocs = query(
        editionsRef,
        orderBy("edition", "desc"),
        limit(1)
      );
      const docs = await getDocs(queryDocs);
      docs.forEach(async (doc) => {
        // doc.data() is never undefined for query doc snapshots
        console.log(doc.data());
        setData(doc.data());
      });
    };

    fetchData();
  }, []);

  //load doc from firebase then display account
  return (
    <>
      <Container maxWidth="xl">
        <Helmet>
          <title> Compte </title>
        </Helmet>
        {data ? <Account data={data} /> : <Loading />}

      </Container>
    </>
  );
}
