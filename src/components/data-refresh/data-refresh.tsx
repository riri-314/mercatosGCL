import { useEffect, useRef, useState } from "react";
import { Box, Button, Tooltip } from "@mui/material";
import { useData } from "../../data/DataProvider";
import { useAuth } from "../../auth/AuthProvider";
import ClubIcon from "../club-icon/club-icon";

export default function DataRefresh() {
  const { data, refetchData, fetchedTime } = useData();
  const { user } = useAuth();
  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => () => clearTimeout(timeout.current), []);
  if (!data || !fetchedTime) return null;
  if (user)
    return (
      <Box
        sx={{
          display: "flex",
          gap: 0.75,
          alignItems: "center",
          color: "success.main",
          fontSize: 11,
          whiteSpace: "nowrap",
        }}
      >
        <span className="club-live-dot" />
        En direct
      </Box>
    );
  const seconds = Math.max(0, Math.floor((now - fetchedTime) / 1000));
  const age =
    seconds < 60
      ? `${seconds}s`
      : seconds < 3600
        ? `${Math.floor(seconds / 60)}min`
        : `${Math.floor(seconds / 3600)}h`;
  return (
    <Tooltip title={`Données actualisées il y a ${age}`}>
      <span>
        <Button
          size="small"
          disabled={refreshing}
          aria-label="Actualiser les enchères"
          onClick={() => {
            setRefreshing(true);
            refetchData();
            timeout.current = setTimeout(() => setRefreshing(false), 1000);
          }}
          startIcon={
            <ClubIcon name="refresh" sx={{ fontSize: "15px !important" }} />
          }
          sx={{
            fontSize: 10,
            color: "text.secondary",
            p: 0.75,
            whiteSpace: "nowrap",
          }}
        >
          {refreshing ? "Actualisation…" : "Actualiser"}
        </Button>
      </span>
    </Tooltip>
  );
}
