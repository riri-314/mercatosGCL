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
  LabelList,
} from "recharts";
import type { ComitardWithMeta, NormalizedEnchere } from "../../types/results.types";

function CustomTooltip({ active, payload }: any) {
  const theme = useTheme();

  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload as NormalizedEnchere & { sender: string };
  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "8px",
        boxShadow: theme.shadows[3],
        borderRadius: "5px",
        lineHeight: "0.5rem",
      }}
    >
      <p>
        <strong>{row.sender}</strong>
      </p>
      <p>{payload[0].value} futs</p>
      <p>{row.time.toLocaleString()}</p>
    </div>
  );
}

type Props = {
  comitard: ComitardWithMeta;
  isClosed: boolean;
};

export function ComitardBidChart({ comitard, isClosed }: Props) {
  const theme = useTheme();

  const chartData: NormalizedEnchere[] = useMemo(
    () =>
      comitard.encheres.map((e) => ({
        time: new Date(e.date.toMillis()),
        votes: e.vote,
        sender: e.sender,
      })),
    [comitard.encheres]
  );

  return (
    <Box sx={{ height: theme.spacing(16), mt: 2, ml: -4, mb: -2, mr: 1 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis dataKey="time" padding={{ left: 20, right: 20 }} />
          <YAxis padding={{ top: 10, bottom: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="votes"
            stroke={isClosed ? theme.palette.success.main : theme.palette.info.main}
            strokeWidth={2}
          >
            <LabelList
              dataKey="sender"
              position="bottom"
              content={(props) => {
                const { x, y, value } = props as any;
                return (
                  <text
                    x={x}
                    dx={6}
                    y={y}
                    dy={4}
                    fontSize={10}
                    fill="#666"
                    textAnchor="inside"
                    transform={`rotate(90, ${x}, ${y})`}
                  >
                    {value}
                  </text>
                );
              }}
            />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}