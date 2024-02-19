import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import {useAuth} from "../../auth/AuthProvider";
import {useData} from "../../data/DataProvider";
import Loading from "../loading/loading";
import ComitardCard from "./comitard-card.tsx";

import {useEffect, useState} from "react";
import {Box} from "@mui/material";
import Iconify from "../../components/iconify/iconify";


// ----------------------------------------------------------------------
export default function ComitardsView() {
    const {user} = useAuth();
    const {data, refetchData, fetchedTime} = useData();
    const [isInTimeFrame, setIsInTimeFrame] = useState(false);
    const [refreshTime, setRefreshTime] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        isInTimeFrameFN();
        const interval = setInterval(() => {
            isInTimeFrameFN();
            setRefreshTime(formatTime(Date.now() - fetchedTime));
        }, 1000); // Update every second
        return () => clearInterval(interval);
    }, [data]);

    //isInTimeFrameFN();

    function nbFutsLeft(): number {
        if (user) {
            const nbFuts = data?.data().cercles[user?.uid]?.nbFut;
            if (nbFuts) {
                return nbFuts;
            } else {
                return 0;
            }
        } else {
            return 0;
        }
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

    function isInTimeFrameFN(): void {
        //console.log("isInTimeFrameFN");
        const date = new Date();
        const start = data?.data().start;
        const stop = data?.data().stop;
        if (start && stop) {
            if (date.getTime() > start.toMillis() && date.getTime() < stop.toMillis()) {
                //console.log("It is really in time frame", date.getTime() - stop.toMillis());
                setIsInTimeFrame(true);
            } else {
                //console.log("It is really NOT in time frame");

                setIsInTimeFrame(false);
            }
        } else {
            //console.log("It is really NOT in time frame START OR STOP IS NULL");

            setIsInTimeFrame(false);
        }
    }

    function formatTime(time: number): string {
        const hours = Math.floor(time / (1000 * 60 * 60));
        const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((time % (1000 * 60)) / 1000);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    function refresh() {
        setRefreshing(true);
        console.log("refresh");
        refetchData();
        const time = 4000;
        setTimeout(() => {
            setRefreshing(false);
        }, time);
    }

    function getCerclesDataWithNames(cerclesData: any): any {
        const cerclesWithNames: any = {};

        Object.keys(cerclesData).forEach((cercleId) => {
            cerclesWithNames[cercleId] = {name: cerclesData[cercleId].name};
        });

        return cerclesWithNames;
    }

    return (<Container>
            <Container>
                {data && refreshTime && !refreshing ? (<>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontStyle: "oblique",
                                m: -1,
                            }}
                            onClick={() => refresh()}
                        >
                            <Typography variant="body1" sx={{marginLeft: "5px"}}>
                                Rafraîchi il y a {refreshTime}.
                            </Typography>
                            <Iconify icon="material-symbols-light:refresh"/>
                        </Box>
                    </>) : (<>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontStyle: "oblique",
                                m: -1,
                            }}
                        >
                            <Typography variant="body1" sx={{marginLeft: "5px"}}>
                                Mise à jour...
                            </Typography>
                        </Box>
                    </>)}
            </Container>
            {data ? (Object.keys(data.data().cercles)
                    .sort((a, b) => data
                        .data().cercles[a].name.localeCompare(data.data().cercles[b].name))
                    .map((cercleId) => (<div key={cercleId} style={{marginBottom: "20px"}}>
                            <Typography sx={{m: 3}} variant="h3">
                                {data.data().cercles[cercleId].name}
                            </Typography>
                            <Grid container spacing={3}>
                                {data.data().cercles[cercleId].comitards && Object.keys(data.data().cercles[cercleId].comitards)
                                    .sort((a, b) => data
                                        .data().cercles[cercleId].comitards[a].name.localeCompare(data.data().cercles[cercleId].comitards[b].name))
                                    .map((comitardID: any) => (<Grid key={comitardID} item xs={12} sm={6} md={3}>
                                            <ComitardCard
                                                product={data.data().cercles[cercleId].comitards[comitardID]}
                                                user={user?.uid}
                                                cercleId={cercleId}
                                                comitardId={comitardID}
                                                editionId={data.id}
                                                nbFutsLeft={nbFutsLeft()}
                                                enchereMax={enchereMinMax()[1]}
                                                enchereMin={enchereMinMax()[0]}
                                                isInTimeFrame={isInTimeFrame}
                                                refetchData={refetchData}
                                                cerclesData={getCerclesDataWithNames(data.data().cercles)}/>
                                        </Grid>))}
                            </Grid>
                        </div>))) : (<Loading/>)}
        </Container>);

}
