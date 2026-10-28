import Box from "@mui/material/Box";
import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type {
  ComitardWithMeta,
  NormalizedEnchere,
} from "../../types/results.types";

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as NormalizedEnchere & { sender: string };
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        p: 1.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
        fontSize: 11,
        boxShadow: "0 4px 14px #172c4212",
      }}
    >
      <strong>
        {row.sender} · {row.votes} fûts
      </strong>
      <Box sx={{ color: "text.secondary", mt: 0.5 }}>
        {row.time.toLocaleString("fr-BE")}
      </Box>
    </Box>
  );
}

type Props = { comitard: ComitardWithMeta; isClosed: boolean };
export function ComitardBidChart({ comitard, isClosed }: Props) {
  const theme = useTheme();
  const chartData: NormalizedEnchere[] = useMemo(
    () =>
      comitard.encheres.map((bid) => ({
        time: new Date(bid.date.toMillis()),
        votes: bid.vote,
        sender: bid.sender,
      })),
    [comitard.encheres],
  );
  return (
    <Box
      role="img"
      aria-label={`Évolution de ${comitard.encheres.length} offres, dernière enchère à ${comitard.encheres.at(-1)?.vote ?? 0} fûts`}
      sx={{ height: 80, px: 1 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 16, bottom: 12, left: 12, right: 12 }}
        >
          <XAxis dataKey="time" hide />
          <YAxis hide domain={[0, "auto"]} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="votes"
            stroke={
              isClosed ? theme.palette.success.main : theme.palette.primary.main
            }
            strokeWidth={2}
            dot={{ r: 3, fill: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
