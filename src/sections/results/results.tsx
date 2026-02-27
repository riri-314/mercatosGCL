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

export default function ResultsPage() {
  const { data } = useData();
  const { running, closed } = useComitardResults(data);

  const [value, setValue] = useState("1");

  return (
    <TabContext value={value}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <TabList onChange={(_, newValue) => setValue(newValue)}>
          <Tab label="Enchères en cours" value="1" sx={{ ml: 4 }} />
          <Tab label="Enchères remportées" value="2" />
        </TabList>
      </Box>

      <TabPanel value="1">
        <Alert severity="info" sx={{ mb: 2 }}>
          Il est possible de voir la date de fin de l&apos;enchère ou le temps restant en cliquant sur l&apos;étiquette orange
        </Alert>

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
      </TabPanel>

      <TabPanel value="2">
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
      </TabPanel>
    </TabContext>
  );
}