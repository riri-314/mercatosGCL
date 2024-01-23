import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import { useAuth } from "../../auth/AuthProvider";
import { useData } from "../../data/DataProvider";
import { DocumentData } from "@firebase/firestore";
import Loading from "../loading/loading";
import ProductCard from "./product-card";
import { useEffect, useState } from "react";

// ----------------------------------------------------------------------

interface DataContextValue {
  data: DocumentData | null;
  refetchData: () => void;
}

export default function ProductsView() {
  const user = useAuth();
  const { data, refetchData } = useData() as DataContextValue;
  const [isInTimeFrame, setIsInTimeFrame] = useState(false);

  useEffect(() => {
    isInTimeFrameFN();
    const interval = setInterval(() => {
      isInTimeFrameFN();
    }, 1000); // Update every second
    return () => clearInterval(interval);
  }, [data]);
  //isInTimeFrameFN();

  function nbFutsLeft(): number {
    if (user) {
      const nbFuts = data?.data().cercles[user?.uid].nbFut;
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
      if (
        date.getTime() > start.toMillis() &&
        date.getTime() < stop.toMillis()
      ) {
        //console.log("It is really in time frame");
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

  return (
    <Container>
      {data ? (
        Object.keys(data.data().cercles)
          .sort((a, b) => data.data().cercles[a].name.localeCompare(data.data().cercles[b].name))
          .map((cercleId) => (
          <div key={cercleId} style={{ marginBottom: "20px" }}>
            <Typography sx={{ m: 3 }} variant="h3">
              {data.data().cercles[cercleId].name}
            </Typography>
            <Grid container spacing={3}>
              {data.data().cercles[cercleId].comitards &&
                Object.keys(data.data().cercles[cercleId].comitards)
                .sort((a, b) => data.data().cercles[cercleId].comitards[a].name.localeCompare(data.data().cercles[cercleId].comitards[b].name))
                .map(
                  (comitardID: any) => (
                    <Grid key={comitardID} item xs={12} sm={6} md={3}>
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
                        isInTimeFrame={isInTimeFrame}
                        refetchData={refetchData}
                      />
                    </Grid>
                  )
                )}
            </Grid>
          </div>
        ))
      ) : (
        <Loading />
      )}
    </Container>
  );
}
