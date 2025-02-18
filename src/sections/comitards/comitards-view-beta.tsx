import React, { useState, useEffect } from "react";
import { useData } from "../../data/DataProvider";
import { useAuth } from "../../auth/AuthProvider";
import { Container, Grid, Typography } from "@mui/material";
import Loading from "../loading/loading";
import DataRefresh from "../../components/data-refresh/data-refresh";

// Parent component
const ComitardView = () => {
  const { data } = useData();
  const { user, isAdmin } = useAuth();
  const [isInTimeFrame, setIsInTimeFrame] = useState(false);
  const [displayEncheres, setDisplayEncheres] = useState(false); //if the enchere should be displayed

  // Calculate initial data
  useEffect(() => {
    setDisplayEncheres(displayEncheresFn());
  }, [data]);

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

  function enchereMinMaxFn(): number[] {
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

  //  function getCerclesDataWithNames(cerclesData: any): any {
  //    const cerclesWithNames: any = {};
  //
  //    Object.keys(cerclesData).forEach((cercleId) => {
  //      cerclesWithNames[cercleId] = { name: cerclesData[cercleId].name };
  //    });
  //
  //    return cerclesWithNames;
  //  }

  function displayEncheresFn(): boolean {
    //const date = new Date();
    if (user && !isAdmin() && nbFutsLeft() >= enchereMinMaxFn()[0]) {
      return true;
    }
    return false;
  }

  function inInterval(): boolean {
    const date = new Date();
    const start = data?.data().start;
    const stop = data?.data().stop;
    if (start && stop) {
      if (
        date.getTime() > start.toMillis() &&
        date.getTime() < stop.toMillis()
      ) {
        return true;
      }
    }
    return false;
  }

  // Timer effect
useEffect(() => {
    if (user) {
        setIsInTimeFrame(inInterval());
        const interval = setInterval(() => {
            setIsInTimeFrame(inInterval());
        }, 1000);

        return () => clearInterval(interval);
    }
}, [user]);

  // Memoize the heavy calculations
  //const calculatedData = useMemo(() => {
  //  return comitardsData.map(comitard => ({
  //    ...comitard,
  //    // Expensive calculations here
  //    processedData: heavyCalculation(comitard)
  //  }));
  //}, [comitardsData]); // Only recalculate when comitardsData changes

  return (
    <Container>
      <DataRefresh />
      {data ? (
        Object.keys(data.data().cercles)
          .sort((a, b) =>
            data
              .data()
              .cercles[a].name.localeCompare(data.data().cercles[b].name)
          )
          .map((cercleId) => (
            <div key={cercleId} style={{ marginBottom: "20px" }}>
              <Typography sx={{ m: 3 }} variant="h3">
                {data.data().cercles[cercleId].name}
              </Typography>
              <Grid container spacing={3}>
                {data.data().cercles[cercleId].comitards &&
                  Object.keys(data.data().cercles[cercleId].comitards)
                    .sort((a, b) =>
                      data
                        .data()
                        .cercles[cercleId].comitards[a].name.localeCompare(
                          data.data().cercles[cercleId].comitards[b].name
                        )
                    )
                    .map((comitardID: any) => (
                      <Grid key={comitardID} item xs={12} sm={6} md={3}>
                        <ComitardCard
                          key={comitardID}
                          data={
                            data.data().cercles[cercleId].comitards[comitardID]
                          }
                          isInTimeFrame={isInTimeFrame}
                          displayEncheres={displayEncheres}
                        />
                      </Grid>
                    ))}
              </Grid>
            </div>
          ))
      ) : (
        <Loading />
      )}
    </Container>
  );
};

// Optimized child component using React.memo
const ComitardCard = React.memo(
  ({ data, isInTimeFrame, displayEncheres }: any) => {
    console.log(`Rendering card for ${data.name}, ${displayEncheres}, ${isInTimeFrame}`); // For demonstration
    return (
      <div className="p-4 border rounded-lg shadow">
        <h3 className="text-lg font-bold">{data.name}</h3>
        <h3 className="text-lg font-bold">{displayEncheres}</h3>
        <h3 className="text-lg font-bold">{isInTimeFrame}</h3>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Only re-render if:
    // 1. The data object has changed
    // 2. The timer has changed AND this card needs the timer
    if (prevProps.data !== nextProps.data) return false; //if data change, re-render
    if (prevProps.displayEncheres !== nextProps.displayEncheres) return false; //displayEnchere change, re-render
    if (
      prevProps.displayEncheres &&
      prevProps.isInTimeFrame !== nextProps.isInTimeFrame
    )
      return false;
    return true;
  }
);

// Helper function for demonstration
//const heavyCalculation = (comitard) => {
//  // Simulate expensive computation
//  return `Processed ${comitard.name}`;
//};

export default ComitardView;
