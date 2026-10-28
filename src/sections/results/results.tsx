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
import { useData } from "../../data/DataProvider";
import { useComitardResults } from "./results-helper";
import { ComitardResultCard } from "./results-card";
import ClubIcon from "../../components/club-icon/club-icon";
import DataRefresh from "../../components/data-refresh/data-refresh";
import RouterLink from "../../routes/components/router-link";
import { normalizeSearch } from "../../utils/search";

export default function ResultsPage() {
  const { data } = useData();
  const { running, closed } = useComitardResults(data);
  const [tab, setTab] = useState("running");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("time");
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
            (b.encheres.at(-1)?.vote ?? 0) - (a.encheres.at(-1)?.vote ?? 0),
        )
      : list;
  }, [running, closed, tab, search, sort]);

  return (
    <Box>
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
          Résultats
        </Typography>
        <DataRefresh />
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "stretch", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 1.5, md: 2 },
          borderBottom: "1px solid",
          borderColor: "divider",
          pb: 1.5,
          mb: 2.5,
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          aria-label="État des enchères"
          sx={{
            minHeight: 44,
            flexShrink: 0,
            "& .MuiTab-root": {
              minHeight: 44,
              px: { xs: 1, sm: 1.5 },
              minWidth: 0,
              fontSize: { xs: 11, sm: 12 },
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
                    height: 20,
                    fontSize: 10,
                    bgcolor: "primary.lighter",
                    color: "primary.dark",
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
                  sx={{ height: 20, fontSize: 10 }}
                />
              </Box>
            }
          />
        </Tabs>
        <Box sx={{ flexGrow: 1, display: { xs: "none", md: "block" } }} />
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
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          gap: 2,
        }}
      >
        <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
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
              py: 7,
              px: 2,
              bgcolor: "background.paper",
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 3,
            }}
          >
            <ClubIcon
              name={search ? "search" : "cup"}
              sx={{ fontSize: 32, color: "primary.main", mb: 1.5 }}
            />
            <Typography
              component="h3"
              sx={{ fontSize: 18, fontWeight: 600, mb: 1 }}
            >
              {search
                ? "Aucune enchère trouvée"
                : tab === "running"
                  ? "Aucune enchère en cours"
                  : "Aucune enchère remportée"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 2 }}>
              {search
                ? "Essayez un autre nom ou un autre cercle."
                : tab === "running"
                  ? "Les prochaines enchères apparaîtront ici."
                  : "Les résultats apparaîtront à la fin des enchères."}
            </Typography>
            {search ? (
              <Button onClick={() => setSearch("")}>
                Effacer la recherche
              </Button>
            ) : (
              <Button
                component={RouterLink}
                href="/comitards"
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
