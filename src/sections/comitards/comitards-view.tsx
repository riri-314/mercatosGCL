import { useEffect, useMemo, useState } from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Theme,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import { useAuth } from "../../auth/AuthProvider";
import { useData } from "../../data/DataProvider";
import Loading from "../loading/loading";
import ComitardCard from "./comitard-card.tsx";
import Iconify from "../../components/iconify/iconify";
import DataRefresh from "../../components/data-refresh/data-refresh.tsx";

type CerclesData = Record<string, { name: string }>;

export default function ComitardsView() {
  const { user } = useAuth();
  const { data, refetchData } = useData();

  const theme: Theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // Single global clock tick (instead of intervals in every card)
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const raw = data?.data();

  const cerclesData: CerclesData = useMemo(() => {
    const cercles = raw?.cercles;
    if (!cercles) return {};
    const out: CerclesData = {};
    for (const cercleId of Object.keys(cercles)) {
      out[cercleId] = { name: cercles[cercleId].name };
    }
    return out;
  }, [raw?.cercles]);

  const nbFutsLeft = useMemo(() => {
    if (!user || !raw?.cercles?.[user.uid]) return 0;
    return raw.cercles[user.uid]?.nbFut ?? 0;
  }, [raw?.cercles, user]);

  const enchereMin = useMemo(() => raw?.enchereMin ?? 0, [raw?.enchereMin]);
  const enchereMax = useMemo(() => raw?.enchereMax ?? 0, [raw?.enchereMax]);

  const isInTimeFrame = useMemo(() => {
    const start = raw?.start;
    const stop = raw?.stop;
    if (!start || !stop) return false;
    const t = now;
    return t > start.toMillis() && t < stop.toMillis();
  }, [raw?.start, raw?.stop, now]);

  // Precompute sorted structure once per data change
  const sortedCercles = useMemo(() => {
    const cercles = raw?.cercles;
    if (!cercles) return [];

    return Object.keys(cercles)
      .sort((a, b) => cercles[a].name.localeCompare(cercles[b].name))
      .map((cercleId) => {
        const comitardsObj = cercles[cercleId].comitards ?? null;
        const comitardIds = comitardsObj
          ? Object.keys(comitardsObj).sort((a, b) =>
              comitardsObj[a].name.localeCompare(comitardsObj[b].name)
            )
          : [];

        return {
          cercleId,
          cercleName: cercles[cercleId].name,
          comitardsObj,
          comitardIds,
        };
      });
  }, [raw?.cercles]);

  return (
    <Container>
      <DataRefresh />

      {!data ? (
        <Loading />
      ) : (
        sortedCercles.map(({ cercleId, cercleName, comitardsObj, comitardIds }) => {
          const hasNone = !comitardsObj || comitardIds.length === 0;

          const emptyText = isInTimeFrame
            ? "Aucun comitard n'a pu participer, snif 😥"
            : `Aucun comitard ${cercleName} pour le moment ⌛`;

          const content = (
            <>
              {hasNone && <Box sx={{ mb: 4, mt: -4, ml: 3 }}>{emptyText}</Box>}

              <Grid container spacing={3}>
                {comitardsObj &&
                  comitardIds.map((comitardID) => (
                    <Grid key={comitardID} item xs={12} sm={6} md={3}>
                      <ComitardCard
                        product={comitardsObj[comitardID]}
                        user={user?.uid}
                        cercleId={cercleId}
                        comitardId={comitardID}
                        editionId={data.id}
                        nbFutsLeft={nbFutsLeft}
                        enchereMin={enchereMin}
                        enchereMax={enchereMax}
                        isInTimeFrame={isInTimeFrame}
                        now={now}
                        refetchData={refetchData}
                        cerclesData={cerclesData}
                      />
                    </Grid>
                  ))}
              </Grid>
            </>
          );

          return (
            <div key={cercleId} style={{ marginBottom: "20px" }}>
              {isSmallScreen ? (
                <Accordion>
                  <AccordionSummary
                    expandIcon={
                      <Iconify
                        width={40}
                        icon="solar:double-alt-arrow-down-bold-duotone"
                        sx={{
                          color: (theme: Theme) => `${theme.palette.primary.main}`,
                        }}
                        fallback={<span>↓</span>}
                      />
                    }
                  >
                    <Typography sx={{ m: 3 }} variant="h3">
                      {cercleName}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>{content}</AccordionDetails>
                </Accordion>
              ) : (
                <>
                  <Typography sx={{ m: 3 }} variant="h3">
                    {cercleName}
                  </Typography>
                  {content}
                </>
              )}
            </div>
          );
        })
      )}
    </Container>
  );
}