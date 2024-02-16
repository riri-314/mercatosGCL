import {Helmet} from "react-helmet-async";
import Container from "@mui/material/Container";
import Loading from "../sections/loading/loading";
import Account from "../sections/account/account-view";
import {useData} from "../data/DataProvider";

// --------------------------------------
export default function AccountPage() {
    const {data, refetchData} = useData();

    //load doc from firebase then display account
    return (<>
            <Container maxWidth="xl">
                <Helmet>
                    <title> Compte </title>
                </Helmet>
                {data ? <Account data={data} refetchData={refetchData}/> : <Loading/>}
            </Container>
        </>);
}
