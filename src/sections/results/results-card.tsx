import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import { lazy, memo, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@mui/material/styles";
import type { ComitardWithMeta } from "../../types/results.types";
import { ComitardHeader } from "./results-comitard-header";
import { ComitardStatusChips } from "./results-comitard-status-ship";

// recharts is ~350 KB; loading it lazily lets the cards paint immediately and
// streams the charts in afterwards instead of blocking the whole results page.
const ComitardBidChart = lazy(() =>
  import("./results-comitard-shart").then((m) => ({ default: m.ComitardBidChart }))
);

export type ComitardResultCardProps = {
  comitard: ComitardWithMeta;
};

function ComitardResultCardBase({ comitard }: ComitardResultCardProps) {
  const theme = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartVisible, setChartVisible] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    if (chartVisible || !chartRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) setChartVisible(true);
    }, { rootMargin: "200px" });
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, [chartVisible]);
  const isClosed = useMemo(
    () => (comitard.enchereStop?.toMillis() ?? Number.POSITIVE_INFINITY) < Date.now(),
    [comitard.enchereStop]
  );

  return (
    <Card>
      <ComitardHeader comitard={comitard} />
      <CardContent sx={{ pl: 3, pr: 3 }}>
        <ComitardStatusChips comitard={comitard} isClosed={isClosed} />
        <Box ref={chartRef} sx={{ minHeight: theme.spacing(16) }}>
          {chartVisible ? <Suspense fallback={<Box sx={{ height: theme.spacing(16), mt: 2, mb: -2 }} />}>
            <ComitardBidChart comitard={comitard} isClosed={isClosed} />
          </Suspense> : <Box sx={{ height: theme.spacing(16), mt: 2, mb: -2 }} />}
        </Box>
      </CardContent>
    </Card>
  );
}

export const ComitardResultCard = memo(ComitardResultCardBase);