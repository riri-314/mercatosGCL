import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { memo, useMemo } from "react";
import type { ComitardWithMeta } from "../../types/results.types";
import { ComitardHeader } from "./results-comitard-header";
import { ComitardStatusChips } from "./results-comitard-status-ship";
import { ComitardBidChart } from "./results-comitard-shart";

export type ComitardResultCardProps = {
  comitard: ComitardWithMeta;
};

function ComitardResultCardBase({ comitard }: ComitardResultCardProps) {
  const isClosed = useMemo(
    () => (comitard.enchereStop?.toMillis() ?? Number.POSITIVE_INFINITY) < Date.now(),
    [comitard.enchereStop]
  );

  return (
    <Card>
      <ComitardHeader comitard={comitard} />
      <CardContent sx={{ pl: 3, pr: 3 }}>
        <ComitardStatusChips comitard={comitard} isClosed={isClosed} />
        <ComitardBidChart comitard={comitard} isClosed={isClosed} />
      </CardContent>
    </Card>
  );
}

export const ComitardResultCard = memo(ComitardResultCardBase);