import { useBoundaryTime } from "../../hooks/use-boundary-time";
import { getEditionData } from "../../data/edition-data";
import { useMemo, useState } from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Theme,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Button,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import { useAuth } from "../../auth/AuthProvider";
import { useData } from "../../data/DataProvider";
import Loading from "../loading/loading";
import ComitardCard from "./comitard-card.tsx";
import DataRefresh from "../../components/data-refresh/data-refresh.tsx";
import ClubIcon from "../../components/club-icon/club-icon";
import { normalizeSearch } from "../../utils/search";

type CerclesData = Record<string, { name: string }>;

export default function ComitardsView() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [circle, setCircle] = useState("all");
  const { data, refetchData } = useData();

  const theme: Theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const raw = getEditionData(data);
  const now = useBoundaryTime(
    raw?.start?.toMillis() ?? null,
    raw?.stop?.toMillis() ?? null,
  );

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
    return t >= start.toMillis() && t < stop.toMillis();
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
              comitardsObj[a].name.localeCompare(comitardsObj[b].name),
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

  const filteredCercles = sortedCercles
    .filter((group) => circle === "all" || circle === group.cercleId)
    .map((group) => ({
      ...group,
      comitardIds: group.comitardIds.filter((id) => {
        const profile = group.comitardsObj[id];
        return normalizeSearch(
          `${profile.firstname} ${profile.name} ${profile.nickname} ${group.cercleName}`,
        ).includes(normalizeSearch(search));
      }),
    }))
    .filter((group) => !search || group.comitardIds.length > 0);
  const total = sortedCercles.reduce(
    (sum, group) => sum + group.comitardIds.length,
    0,
  );

  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
        }}
      >
        <Typography component="h1" variant="h4">
          Comitards
        </Typography>
        <DataRefresh />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
        }}
      >
        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
          {data
            ? `${total} comitards · ${sortedCercles.length} cercles`
            : "Chargement…"}
        </Typography>
        <TextField
          size="small"
          placeholder="Un nom, un surnom, un cercle…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          inputProps={{ "aria-label": "Rechercher un comitard" }}
          sx={{
            width: { xs: "100%", sm: 300 },
            "& input": { fontSize: { xs: 16, sm: 13 }, minHeight: 24 },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <ClubIcon name="search" sx={{ fontSize: 18 }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="Effacer la recherche"
                  onClick={() => setSearch("")}
                >
                  <ClubIcon name="close" sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Box>
      <Tabs
        value={circle}
        onChange={(_, value) => setCircle(value)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="Filtrer par cercle"
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          mb: 3,
          "& .MuiTab-root": { fontSize: 11, minWidth: 64, px: 2 },
        }}
      >
        <Tab label="Tous les cercles" value="all" />
        {sortedCercles.map((group) => (
          <Tab
            key={group.cercleId}
            label={group.cercleName}
            value={group.cercleId}
          />
        ))}
      </Tabs>
      {data && filteredCercles.length === 0 && (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <ClubIcon
            name="search"
            sx={{ color: "primary.main", fontSize: 30, mb: 1.5 }}
          />
          <Typography variant="h6">Aucun comitard trouvé</Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary", my: 1 }}>
            Essayez un autre nom ou explorez les autres cercles.
          </Typography>
          <Button
            onClick={() => {
              setSearch("");
              setCircle("all");
            }}
          >
            Voir tous les comitards
          </Button>
        </Box>
      )}
      {!data ? (
        <Loading />
      ) : (
        filteredCercles.map(
          ({ cercleId, cercleName, comitardsObj, comitardIds }) => {
            const hasNone = !comitardsObj || comitardIds.length === 0;

            const emptyText = isInTimeFrame
              ? "Aucun comitard n'a pu participer, snif 😥"
              : `Aucun comitard ${cercleName} pour le moment ⌛`;

            const content = (
              <>
                {hasNone && (
                  <Box
                    sx={{
                      p: 3,
                      color: "text.secondary",
                      fontSize: 13,
                      bgcolor: "background.neutral",
                      borderRadius: 2,
                    }}
                  >
                    {emptyText}
                  </Box>
                )}

                <Grid container spacing={3}>
                  {comitardsObj &&
                    comitardIds.map((comitardID) => (
                      <Grid key={comitardID} item xs={12} sm={6} md={4} xl={3}>
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
                          refetchData={refetchData}
                          cerclesData={cerclesData}
                        />
                      </Grid>
                    ))}
                </Grid>
              </>
            );

            return (
              <Box
                component="section"
                key={cercleId}
                sx={{ mb: { xs: 2, sm: 4.5 } }}
              >
                {isSmallScreen && !search && circle === "all" ? (
                  <Accordion slotProps={{ transition: { mountOnEnter: true } }}>
                    <AccordionSummary
                      expandIcon={
                        <ClubIcon
                          name="arrow"
                          sx={{
                            fontSize: 20,
                            color: "primary.main",
                            transform: "rotate(90deg)",
                          }}
                        />
                      }
                    >
                      <Typography
                        sx={{
                          my: 1,
                          fontSize: 22,
                          fontWeight: 700,
                          letterSpacing: "-.04em",
                        }}
                      >
                        {cercleName}{" "}
                        <Box
                          component="span"
                          sx={{
                            ml: 1,
                            fontSize: 11,
                            color: "text.secondary",
                            fontWeight: 400,
                          }}
                        >
                          {comitardIds.length} comitards
                        </Box>
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>{content}</AccordionDetails>
                  </Accordion>
                ) : (
                  <>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Typography
                        component="h2"
                        sx={{
                          fontSize: 24,
                          fontWeight: 700,
                          letterSpacing: "-.04em",
                        }}
                      >
                        {cercleName}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 11, color: "text.secondary" }}
                      >
                        {comitardIds.length} comitards
                      </Typography>
                      <Box
                        sx={{
                          flexGrow: 1,
                          borderTop: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                    </Box>
                    {content}
                  </>
                )}
              </Box>
            );
          },
        )
      )}
    </Container>
  );
}
