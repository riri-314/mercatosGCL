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
import AdminAccount from "../sections/admin-account/admin-account-view";

// ----------------------------------------------------------------------

export default function AdminAccountPage() {
  const [data, setData] = useState<DocumentData | null>(null);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const editionsRef = collection(db, "editions");

      const queryDocs = query(
        editionsRef,
        orderBy("edition", "desc"),
        limit(1)
      );
      const docs = await getDocs(queryDocs);
      docs.forEach(async (doc) => {
        // doc.data() is never undefined for query doc snapshots
        console.log(doc);
        setData(doc.data());
        setId(doc.id);
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
        {data ? <AdminAccount data={data} id={id} /> : <Loading />}

      </Container>
    </>
  );
}
