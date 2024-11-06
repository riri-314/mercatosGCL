import {Helmet} from 'react-helmet-async';
import ComitardsView from '../sections/products/comitards-view2.tsx';


// ----------------------------------------------------------------------

export default function ComitardsPage() {
    return (<>
            <Helmet>
                <title> Comitards </title>
            </Helmet>

            <ComitardsView/>
        </>);
}
