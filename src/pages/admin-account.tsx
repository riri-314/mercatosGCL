import {Helmet} from "react-helmet-async";
import Container from "@mui/material/Container";
import AdminAccount from "../sections/admin-account/admin-account-view";
import {useData} from "../data/DataProvider";
import Loading from "../sections/loading/loading";
import {collection, DocumentData, getDocs} from "@firebase/firestore";
import {db} from "../firebase_config";
import {useEffect, useState} from "react";

// ----------------------------------------------------------------------

export default function AdminAccountPage() {
    const [data, setData] = useState<DocumentData[] | null>(null);
    const [activeData, setActiveData] = useState<DocumentData | null>(null);
    const {refetchData} = useData();

    //here we fatch all edition and then set to unload

    async function fetchAllData() {
        const editionRef = collection(db, "editions");
        const docs = await getDocs(editionRef);
        const dataArray = docs.docs.map((doc) => doc);
        const activeData = dataArray.filter((item) => item.data().active === true);
        //console.log("Active data: ", activeData[0].data());
        // console.log("data array: ", dataArray.map((doc) => doc.data()))
        setData(dataArray);
        setActiveData(activeData[0])
    }

    useEffect(() => {
        fetchAllData();
    }, [refetchData]);

    // FILEPATH: /home/riri/git/mercatosGCL/src/pages/admin-account.tsx
    return (<>
            <Container maxWidth="xl">
                <Helmet>
                    <title> Compte </title>
                </Helmet>
                {data && activeData ? <AdminAccount data={data} refetchData={refetchData} activeData={activeData}/> :
                    <Loading/>}
            </Container>
        </>);
}
