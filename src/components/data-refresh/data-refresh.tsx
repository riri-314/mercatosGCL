import { useEffect, useRef, useState } from "react";
import { Box, Button, Tooltip } from "@mui/material";
import { useData } from "../../data/data-context";
import { useAuth } from "../../auth/auth-context";
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
          variant="outlined"
          color="inherit"
          disabled={refreshing}
          aria-label="Actualiser les enchères"
          aria-busy={refreshing}
          onClick={() => {
            setRefreshing(true);
            refetchData();
            timeout.current = setTimeout(() => setRefreshing(false), 1000);
          }}
          startIcon={
            <ClubIcon name="refresh" sx={{
              fontSize: "18px !important",
              animation: refreshing ? "refresh-spin 900ms linear infinite" : "none",
              "@keyframes refresh-spin": { to: { transform: "rotate(360deg)" } },
            }} />
          }
          sx={{
            minWidth: 44,
            minHeight: 44,
            flexShrink: 0,
            fontSize: 12,
            fontWeight: 500,
            color: "text.secondary",
            borderColor: "divider",
            bgcolor: "background.paper",
            px: { xs: 1, sm: 1.5 },
            whiteSpace: "nowrap",
            "& .MuiButton-startIcon": { mx: { xs: 0, sm: undefined }, mr: { sm: 0.75 } },
            "&:hover": { borderColor: "text.disabled", bgcolor: "background.neutral" },
          }}
        >
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            Actualiser
          </Box>
        </Button>
      </span>
    </Tooltip>
  );
}
