import {Helmet} from 'react-helmet-async';
import ComitardsView from '../sections/comitards/comitards-view-beta.tsx';


// ----------------------------------------------------------------------

export default function ComitardsPage() {
    return (<>
            <Helmet>
                <title> Comitards </title>
            </Helmet>

            <ComitardsView/>
        </>);
}
