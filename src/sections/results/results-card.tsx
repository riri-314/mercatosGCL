import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import { lazy, memo, Suspense, useMemo } from "react";
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
  const isClosed = useMemo(
    () => (comitard.enchereStop?.toMillis() ?? Number.POSITIVE_INFINITY) < Date.now(),
    [comitard.enchereStop]
  );

  return (
    <Card>
      <ComitardHeader comitard={comitard} />
      <CardContent sx={{ pl: 3, pr: 3 }}>
        <ComitardStatusChips comitard={comitard} isClosed={isClosed} />
        <Suspense fallback={<Box sx={{ height: theme.spacing(16), mt: 2, mb: -2 }} />}>
          <ComitardBidChart comitard={comitard} isClosed={isClosed} />
        </Suspense>
      </CardContent>
    </Card>
  );
}

export const ComitardResultCard = memo(ComitardResultCardBase);