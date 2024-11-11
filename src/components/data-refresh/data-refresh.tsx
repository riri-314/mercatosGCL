import { useEffect, useState } from "react";
import { useData } from "../../data/DataProvider";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import {Box} from "@mui/material";
import Iconify from "../../components/iconify/iconify";



export default function DataRefresh() {
  const [refreshTime, setRefreshTime] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { data, refetchData, fetchedTime } = useData();

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTime(formatTime(Date.now() - fetchedTime));
    }, 1000); // Update every second
    return () => clearInterval(interval);
  }, [data]);

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

  return (
    <Container>
      {data && refreshTime && !refreshing ? (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontStyle: "oblique",
              mt: -1,
              mb: 1,
            }}
            onClick={() => refresh()}
          >
            <Typography variant="body1" sx={{ marginLeft: "5px" }}>
              Rafraîchi il y a {refreshTime}.
            </Typography>
            <Iconify icon="material-symbols-light:refresh" />
          </Box>
        </>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontStyle: "oblique",
            }}
          >
            <Typography variant="body1" sx={{ marginLeft: "5px" }}>
              Mise à jour...
            </Typography>
          </Box>
        </>
      )}
    </Container>
  );
}
