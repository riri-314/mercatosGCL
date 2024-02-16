import {Helmet} from 'react-helmet-async';
import WipView from "../sections/error/wip-view.tsx";
import Container from "@mui/material/Container";


// ----------------------------------------------------------------------

export default function WipPage() {
    return (<Container>
            <Helmet>
                <title> Work in progress </title>
            </Helmet>

            <WipView/>
        </Container>);
}
