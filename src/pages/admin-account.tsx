import {Helmet} from "react-helmet-async";
import Container from "@mui/material/Container";
import AdminAccount from "../sections/admin-account/admin-account-view";
import Loading from "../sections/loading/loading";
import {collection, DocumentData, getDocs} from "@firebase/firestore";
import {db} from "../firebase_config";
import {useCallback, useEffect, useState} from "react";

// ----------------------------------------------------------------------

export default function AdminAccountPage() {
    const [data, setData] = useState<DocumentData[] | null>(null);
    const [activeData, setActiveData] = useState<DocumentData | null>(null);

    // The admin page reads all editions with a one-shot getDocs, so it owns its
    // own refresh. DataProvider.refetchData is a no-op for logged-in users, so
    // relying on it here meant admin edits never showed until a full reload.
    const fetchAllData = useCallback(async () => {
        const editionRef = collection(db, "editions");
        const docs = await getDocs(editionRef);
        const dataArray = docs.docs.map((doc) => doc);
        const activeData = dataArray.filter((item) => item.data().active === true);
        setData(dataArray);
        setActiveData(activeData[0]);
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    return (<>
            <Container maxWidth="xl">
                <Helmet>
                    <title> Compte </title>
                </Helmet>
                {data && activeData ? <AdminAccount data={data} refetchData={fetchAllData} activeData={activeData}/> :
                    <Loading/>}
            </Container>
        </>);
}
