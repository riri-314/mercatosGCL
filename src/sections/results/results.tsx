import { useState } from "react";
import Grid from "@mui/material/Unstable_Grid2";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Alert from "@mui/material/Alert";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

import { useData } from "../../data/DataProvider";
import { useComitardResults } from "./results-helper";
import { ComitardResultCard } from "./results-card";
// NOTE: results-select (filters by winner / cercle) is an unfinished feature,
// stashed for now. Re-wire ResultsToolbar here when it is implemented.

export default function ResultsPage() {
  const { data } = useData();
  const { running, closed } = useComitardResults(data);

  // Auction status tabs
  const [value, setValue] = useState<"1" | "2">("1");

  return (
    <>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList onChange={(_, newValue) => setValue(newValue)}>
            <Tab label="Enchères en cours" value="1" sx={{ ml: 4 }} />
            <Tab label="Enchères remportées" value="2" />
          </TabList>
        </Box>

        <TabPanel value="1" sx={{ backgroundColor: "background.default" }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Il est possible de voir la date de fin de l&apos;enchère ou le temps
            restant en cliquant sur l&apos;étiquette orange
          </Alert>

          {running.length === 0 ? (
            <Box sx={{ mt: 4, ml: 3 }}>
              <Alert severity="info">
                Aucune enchère n&apos;est en cours pour le moment ⌛
              </Alert>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {running.map((comitard) => (
                <Grid
                  key={`${comitard.firstname}-${comitard.name}-${comitard.nickname}`}
                  xl={3}
                  md={4}
                  sm={6}
                  xs={12}
                >
                  <ComitardResultCard comitard={comitard} />
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value="2">
          {closed.length === 0 ? (
            <Box sx={{ mt: 4, ml: 3 }}>
              <Alert severity="info">
                Aucune enchère n&apos;a encore été remportée, revenez plus tard ⌛
              </Alert>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {closed.map((comitard) => (
                <Grid
                  key={`${comitard.firstname}-${comitard.name}-${comitard.nickname}`}
                  xl={3}
                  md={4}
                  sm={6}
                  xs={12}
                >
                  <ComitardResultCard comitard={comitard} />
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </TabContext>
    </>
  );
}
