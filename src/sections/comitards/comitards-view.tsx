import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import { useAuth } from "../../auth/AuthProvider";
import { useData } from "../../data/DataProvider";
import Loading from "../loading/loading";
import ComitardCard from "./comitard-card.tsx";

import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Theme,
} from "@mui/material";
import Iconify from "../../components/iconify/iconify";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import DataRefresh from "../../components/data-refresh/data-refresh.tsx";

// ----------------------------------------------------------------------
export default function ComitardsView() {
  const { user } = useAuth();
  const { data, refetchData } = useData();
  const [isInTimeFrame, setIsInTimeFrame] = useState(false);

  useEffect(() => {
    isInTimeFrameFN();
    const interval = setInterval(() => {
      isInTimeFrameFN();
    }, 1000); // Update every second
    return () => clearInterval(interval);
  }, [data]);

  const theme: Theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

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
      if (
        date.getTime() > start.toMillis() &&
        date.getTime() < stop.toMillis()
      ) {
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

  function getCerclesDataWithNames(cerclesData: any): any {
    const cerclesWithNames: any = {};

    Object.keys(cerclesData).forEach((cercleId) => {
      cerclesWithNames[cercleId] = { name: cerclesData[cercleId].name };
    });

    return cerclesWithNames;
  }

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
              {isSmallScreen && (
                <Accordion>
                  <AccordionSummary
                    expandIcon={
                      <Iconify
                        width={40}
                        icon="solar:double-alt-arrow-down-bold-duotone"
                        sx={{
                          color: (theme: Theme) =>
                            `${theme.palette.primary.main}`,
                        }}
                        fallback={<span>↓</span>}
                      />
                    }
                  >
                    <Typography sx={{ m: 3 }} variant="h3">
                      {data.data().cercles[cercleId].name}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {(!data.data().cercles[cercleId].comitards ||
                      Object.keys(data.data().cercles[cercleId].comitards)
                        .length == 0) &&
                      (isInTimeFrame ? (
                        <Box sx={{ mb: 4, mt: -4, ml: 3 }}>
                          Aucun comitard n'a pu participer, snif 😥
                        </Box>
                      ) : (
                        <Box sx={{ mb: 4, mt: -4, ml: 3 }}>
                          Aucun comitard {data.data().cercles[cercleId].name}{" "}
                          pour le moment ⌛
                        </Box>
                      ))}
                    <Grid container spacing={3}>
                      {data.data().cercles[cercleId].comitards &&
                        Object.keys(data.data().cercles[cercleId].comitards)
                          .sort((a, b) =>
                            data
                              .data()
                              .cercles[cercleId].comitards[
                                a
                              ].name.localeCompare(
                                data.data().cercles[cercleId].comitards[b].name
                              )
                          )
                          .map((comitardID: any) => (
                            <Grid key={comitardID} item xs={12} sm={6} md={3}>
                              <ComitardCard
                                product={
                                  data.data().cercles[cercleId].comitards[
                                    comitardID
                                  ]
                                }
                                user={user?.uid}
                                cercleId={cercleId}
                                comitardId={comitardID}
                                editionId={data.id}
                                nbFutsLeft={nbFutsLeft()}
                                enchereMax={enchereMinMax()[1]}
                                enchereMin={enchereMinMax()[0]}
                                isInTimeFrame={isInTimeFrame}
                                refetchData={refetchData}
                                cerclesData={getCerclesDataWithNames(
                                  data.data().cercles
                                )}
                              />
                            </Grid>
                          ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}

              {!isSmallScreen && (
                <>
                  <Typography sx={{ m: 3 }} variant="h3">
                    {data.data().cercles[cercleId].name}
                  </Typography>
                  {(!data.data().cercles[cercleId].comitards ||
                    Object.keys(data.data().cercles[cercleId].comitards)
                      .length == 0) && (
                        (isInTimeFrame ? (
                          <Box sx={{ mb: 4, mt: -4, ml: 3 }}>
                            Aucun comitard n'a pu participer, snif 😥
                          </Box>
                        ) : (
                          <Box sx={{ mb: 4, mt: -4, ml: 3 }}>
                            Aucun comitard {data.data().cercles[cercleId].name}{" "}
                            pour le moment ⌛
                          </Box>
                        ))
                  )}
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
                              product={
                                data.data().cercles[cercleId].comitards[
                                  comitardID
                                ]
                              }
                              user={user?.uid}
                              cercleId={cercleId}
                              comitardId={comitardID}
                              editionId={data.id}
                              nbFutsLeft={nbFutsLeft()}
                              enchereMax={enchereMinMax()[1]}
                              enchereMin={enchereMinMax()[0]}
                              isInTimeFrame={isInTimeFrame}
                              refetchData={refetchData}
                              cerclesData={getCerclesDataWithNames(
                                data.data().cercles
                              )}
                            />
                          </Grid>
                        ))}
                  </Grid>
                </>
              )}
            </div>
          ))
      ) : (
        <Loading />
      )}
    </Container>
  );
}
