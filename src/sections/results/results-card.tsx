import { useBoundaryTime } from "../../hooks/use-boundary-time";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import { lazy, memo, Suspense, useEffect, useRef, useState } from "react";
import { useTheme } from "@mui/material/styles";
import type { ComitardWithMeta } from "../../types/results.types";
import { ComitardHeader } from "./results-comitard-header";
import { ComitardStatusChips } from "./results-comitard-status-ship";
import Typography from "@mui/material/Typography";
import { getLeadingBid } from "../../utils/auction";

// recharts is ~350 KB; loading it lazily lets the cards paint immediately and
// streams the charts in afterwards instead of blocking the whole results page.
const ComitardBidChart = lazy(() =>
  import("./results-comitard-shart").then((m) => ({
    default: m.ComitardBidChart,
  })),
);

export type ComitardResultCardProps = {
  comitard: ComitardWithMeta;
};

function ComitardResultCardBase({ comitard }: ComitardResultCardProps) {
  const theme = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);
  const hasHistory = comitard.encheres.length > 1;
  const [chartVisible, setChartVisible] = useState(
    () => typeof IntersectionObserver === "undefined",
  );
  useEffect(() => {
    if (chartVisible || !chartRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting))
          setChartVisible(true);
      },
      { rootMargin: "200px" },
    );
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, [chartVisible, hasHistory]);
  const stop = comitard.enchereStop?.toMillis() ?? null;
  const now = useBoundaryTime(null, stop);
  const isClosed = stop != null && now >= stop;

  return (
    <Card
      sx={{
        height: "100%",
        transition: "border-color 180ms, box-shadow 180ms",
        "&:hover": {
          borderColor: "primary.light",
          boxShadow: "0 8px 24px rgba(23,44,66,.06)",
        },
        "& .MuiCardHeader-root": { p: 2.5, pb: 2, alignItems: "center" },
        "& .MuiCardHeader-avatar": { mr: 1.5 },
        "& .MuiCardHeader-title": {
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1.45,
        },
        "& .MuiCardHeader-subheader": {
          fontSize: 10,
          color: "primary.main",
          mt: 0.6,
          fontWeight: 600,
          letterSpacing: ".04em",
        },
        "& .MuiAvatar-root": {
          width: 48,
          height: 48,
          border: "3px solid #F4F6F8",
        },
      }}
    >
      <ComitardHeader comitard={comitard} />
      <CardContent sx={{ px: 2, pt: 0, "&:last-child": { pb: 2 } }}>
        <ComitardStatusChips comitard={comitard} isClosed={isClosed} />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            px: 1,
            mt: 2,
            mb: 1,
          }}
        >
          <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
            {isClosed ? "Transfert conclu" : "En tête"}{" "}
            <Box
              component="span"
              sx={{ color: "text.primary", fontWeight: 700, ml: 0.4 }}
            >
              {!isClosed && (getLeadingBid(comitard.encheres)?.sender || "—")}
            </Box>
          </Typography>
          <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
            {comitard.encheres.length} offre
            {comitard.encheres.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        {hasHistory && (
          <Box
            ref={chartRef}
            sx={{
              minHeight: theme.spacing(10),
              bgcolor: "#F4F7FB",
              borderRadius: 1.5,
              overflow: "hidden",
            }}
          >
            {chartVisible ? (
              <Suspense fallback={<Box sx={{ height: theme.spacing(10) }} />}>
                <ComitardBidChart comitard={comitard} isClosed={isClosed} />
              </Suspense>
            ) : (
              <Box sx={{ height: theme.spacing(10) }} />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export const ComitardResultCard = memo(ComitardResultCardBase);
