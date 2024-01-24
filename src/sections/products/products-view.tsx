import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import {useAuth} from "../../auth/AuthProvider";
import {useData} from "../../data/DataProvider";
import {DocumentData} from "@firebase/firestore";
import Loading from "../loading/loading";
import ProductCard from "./product-card";
import {useEffect} from "react";

// ----------------------------------------------------------------------

interface DataContextValue {
    data: DocumentData | null;
    refetchData: () => void;
}

export default function ProductsView() {
    const user = useAuth();
    const {data} = useData() as DataContextValue;

    useEffect(() => {
        if (user) {
            isInTimeFrame();
            const interval = setInterval(() => {
                isInTimeFrame();
            }, 10000); // Update every 10 seconds
            return () => clearInterval(interval);
        }
    }, [user]);

    function nbFutsLeft(): number {
        const nbFuts = user?.uid && data?.data()?.cercles[user.uid]?.nbFut;
        return nbFuts ?? 0;
    }


    function enchereMinMax(): number[] {
        if (user) {
            const enchereMin = data?.data().enchereMin;
            const enchereMax = data?.data().enchereMax;
            if (enchereMin && enchereMax) {
                return [enchereMin, enchereMax];
            } else {
                return [0, 0];
            }
        } else {
            return [0, 0];
        }
    }

    function isInTimeFrame(): boolean {
        //console.log("isInTimeFrame");
        if (user) {
            const date = new Date();
            const start = data?.data().start;
            const stop = data?.data().stop;
            if (start && stop) {
                if (
                    date.getTime() > start.toMillis() &&
                    date.getTime() < stop.toMillis()
                ) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    return (
        <Container>
            {data ? (
                Object.keys(data.data().cercles).map((cercleId) => (
                    <div key={cercleId} style={{marginBottom: "20px"}}>
                        <Typography sx={{m: 3}} variant="h3">
                            {data.data().cercles[cercleId].name}
                        </Typography>
                        <Grid container spacing={3}>
                            {data.data().cercles[cercleId].comitards &&
                                Object.keys(data.data().cercles[cercleId].comitards).map(
                                    (comitardID: any) => (
                                        <Grid key={comitardID} item xs={12} sm={6} md={4} xl={3}>
                                            <ProductCard
                                                product={
                                                    data.data().cercles[cercleId].comitards[comitardID]
                                                }
                                                user={user?.uid}
                                                cercleId={cercleId}
                                                comitardId={comitardID}
                                                nbFutsLeft={nbFutsLeft()}
                                                enchereMax={enchereMinMax()[1]}
                                                enchereMin={enchereMinMax()[0]}
                                                isInTimeFrame={isInTimeFrame()}
                                            />
                                        </Grid>
                                    )
                                )}
                        </Grid>
                    </div>
                ))
            ) : (
                <Loading/>
            )}
        </Container>
    );
}
