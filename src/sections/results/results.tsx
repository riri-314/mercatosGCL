import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Skeleton,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useData } from "../../data/data-context";
import { getEditionData } from "../../data/edition-data";
import { useAuth } from "../../auth/auth-context";
import { useComitardResults } from "./results-helper";
import { ComitardResultCard } from "./results-card";
import ClubIcon from "../../components/club-icon/club-icon";
import DataRefresh from "../../components/data-refresh/data-refresh";
import RouterLink from "../../routes/components/router-link";
import { normalizeSearch } from "../../utils/search";
import { getLeadingBid } from "../../utils/auction";

export default function ResultsPage() {
  const { data } = useData();
  const { user } = useAuth();
  const { running, closed } = useComitardResults(data);
  const circleName = user?.uid && getEditionData(data)?.cercles?.[user.uid]?.name;
  const [tab, setTab] = useState("running");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("time");
  const hasAuctions = running.length + closed.length > 0;
  const allFinished = running.length === 0 && closed.length > 0;
  const showFilters = (tab === "running" ? running : closed).length > 0;
  const profiles = useMemo(() => {
    const query = normalizeSearch(search);
    const list = (tab === "running" ? running : closed).filter((profile) =>
      normalizeSearch(
        `${profile.firstname} ${profile.name} ${profile.nickname} ${profile.cercle}`,
      ).includes(query),
    );
    return sort === "bid"
      ? [...list].sort(
          (a, b) =>
            (getLeadingBid(b.encheres)?.vote ?? 0) - (getLeadingBid(a.encheres)?.vote ?? 0),
        )
      : list;
  }, [running, closed, tab, search, sort]);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          {circleName && (
            <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>
              Bonjour, {circleName}.
            </Typography>
          )}
          <Typography component="h1" variant="h4" sx={{ fontSize: { xs: 26, sm: 28 } }}>
            Résultats
          </Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.75 }}>
            Suivez les enchères et les transferts entre cercles.
          </Typography>
        </Box>
        <DataRefresh />
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "stretch", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 1.5, md: 2 },
          mb: 2.5,
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          aria-label="État des enchères"
          sx={{
            minHeight: 52,
            flexShrink: 0,
            width: { xs: "100%", md: "auto" },
            borderBottom: "1px solid",
            borderColor: "divider",
            "& .MuiTab-root": {
              minHeight: 52,
              flex: { xs: 1, md: "initial" },
              px: { xs: 1.5, md: 2 },
              minWidth: 0,
              fontSize: 13,
            },
          }}
        >
          <Tab
            id="tab-running"
            aria-controls="auction-results"
            value="running"
            aria-label="Enchères en cours"
            label={
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Box
                  component="span"
                  sx={{ display: { xs: "none", sm: "inline" } }}
                >
                  Enchères en cours
                </Box>
                <Box
                  component="span"
                  sx={{ display: { xs: "inline", sm: "none" } }}
                >
                  En cours
                </Box>
                <Chip
                  label={running.length}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: 11,
                    bgcolor: tab === "running" ? "primary.lighter" : "background.neutral",
                    color: tab === "running" ? "primary.dark" : "text.secondary",
                  }}
                />
              </Box>
            }
          />
          <Tab
            id="tab-closed"
            aria-controls="auction-results"
            value="closed"
            aria-label="Enchères remportées"
            label={
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Box
                  component="span"
                  sx={{ display: { xs: "none", sm: "inline" } }}
                >
                  Enchères remportées
                </Box>
                <Box
                  component="span"
                  sx={{ display: { xs: "inline", sm: "none" } }}
                >
                  Remportées
                </Box>
                <Chip
                  label={closed.length}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: 11,
                    bgcolor: tab === "closed" ? "primary.lighter" : "background.neutral",
                    color: tab === "closed" ? "primary.dark" : "text.secondary",
                  }}
                />
              </Box>
            }
          />
        </Tabs>
        <Box sx={{ flexGrow: 1, display: { xs: "none", md: "block" } }} />
        {showFilters && (
          <TextField
            size="small"
            placeholder="Un nom, un cercle…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            inputProps={{ "aria-label": "Rechercher une enchère" }}
            sx={{
              width: { xs: "100%", md: 205 },
              "& input": { fontSize: { xs: 16, sm: 13 }, minHeight: 24 },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ClubIcon
                    name="search"
                    sx={{ fontSize: 17, color: "text.secondary" }}
                  />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label="Effacer la recherche"
                    onClick={() => setSearch("")}
                  >
                    <ClubIcon name="close" sx={{ fontSize: 15 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
        )}
      </Box>
      {showFilters && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
            gap: 2,
          }}
        >
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
            {profiles.length} enchère{profiles.length !== 1 ? "s" : ""}
            {tab === "running"
              ? " en cours"
              : " remportée" + (profiles.length !== 1 ? "s" : "")}
          </Typography>
          <TextField
            select
            size="small"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            SelectProps={{ inputProps: { "aria-label": "Trier les enchères" } }}
            sx={{
              "& .MuiInputBase-root": { fontSize: 11, bgcolor: "transparent" },
              "& fieldset": { border: 0 },
            }}
          >
            <MenuItem value="time">
              {tab === "running" ? "Se terminent bientôt" : "Les plus récentes"}
            </MenuItem>
            <MenuItem value="bid">Enchères les plus élevées</MenuItem>
          </TextField>
        </Box>
      )}
      <Box
        id="auction-results"
        role="tabpanel"
        aria-labelledby={tab === "running" ? "tab-running" : "tab-closed"}
      >
        {!data ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            {[0, 1, 2].map((key) => (
              <Skeleton
                key={key}
                variant="rounded"
                height={285}
                sx={{ borderRadius: 2.5 }}
              />
            ))}
          </Box>
        ) : profiles.length ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            {profiles.map((profile) => (
              <ComitardResultCard
                key={`${profile.cercle}-${profile.firstname}-${profile.name}-${profile.nickname}`}
                comitard={profile}
              />
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              textAlign: "center",
              py: { xs: 5, sm: 7 },
              px: 3,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <ClubIcon
              name={search ? "search" : allFinished ? "cup" : "clock"}
              sx={{ fontSize: 28, color: "text.secondary", mb: 2 }}
            />
            <Typography
              component="h3"
              sx={{ fontSize: 18, fontWeight: 600, mb: 1 }}
            >
              {search
                ? "Aucune enchère trouvée"
                : !hasAuctions
                  ? "Pas encore d’enchères"
                  : tab === "running"
                    ? "Toutes les enchères sont terminées"
                    : "Aucune enchère remportée"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 2.5, maxWidth: 340, mx: "auto" }}>
              {search
                ? "Essayez un autre nom ou un autre cercle."
                : !hasAuctions
                  ? "Retrouvez les comitards et lancez la première enchère depuis leur fiche."
                  : tab === "running"
                    ? "Retrouvez les comitards remportés et le résultat de chaque enchère."
                    : "Les enchères sont encore en cours. Les comitards remportés apparaîtront ici."}
            </Typography>
            {search ? (
              <Button onClick={() => setSearch("")}>
                Effacer la recherche
              </Button>
            ) : tab === "running" && allFinished ? (
              <Button
                variant="outlined"
                onClick={() => setTab("closed")}
                endIcon={<ClubIcon name="arrow" />}
              >
                Voir les enchères remportées
              </Button>
            ) : tab === "closed" && hasAuctions ? (
              <Button variant="outlined" onClick={() => setTab("running")}>
                Voir les enchères en cours
              </Button>
            ) : (
              <Button
                component={RouterLink}
                href="/comitards"
                variant="outlined"
                endIcon={<ClubIcon name="arrow" />}
              >
                Voir les comitards
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
