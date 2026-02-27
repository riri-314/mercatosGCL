import Box from "@mui/material/Box";
import { useMemo, useState } from "react";
import Iconify from "../../components/iconify/iconify";
import Label from "../../components/label/label";
import { formatTimeLeft } from "./results-helper";
import type { ComitardWithMeta } from "../../types/results.types";

type Props = {
  comitard: ComitardWithMeta;
  isClosed: boolean;
};

export function ComitardStatusChips({ comitard, isClosed }: Props) {
  const [timeOrDate, setTimeOrDate] = useState(true);

  const lastEnchere = comitard.encheres.at(-1);

  const timeLeft = useMemo(() => {
    if (!comitard.enchereStop) return null;
    return comitard.enchereStop.toMillis() - Date.now();
  }, [comitard.enchereStop]);

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Label variant="filled" color="info" sx={{ textTransform: "uppercase" }}>
        <Iconify icon="mdi:court-hammer" sx={{ mr: "0.3rem" }} />
        {lastEnchere?.vote ?? ""} futs
      </Label>

      {isClosed ? (
        <Label variant="filled" color="success" sx={{ textTransform: "uppercase" }}>
          <Iconify icon="solar:cup-bold" sx={{ mr: "0.3rem" }} />
          {lastEnchere?.sender}
        </Label>
      ) : (
        <Label
          variant="filled"
          color="error"
          onClick={() => setTimeOrDate((v) => !v)}
          sx={{ textTransform: "uppercase", display: "inline-flex" }}
        >
          <Iconify icon={timeOrDate ? "jam:clock" : "jam:calendar"} sx={{ mr: "0.3rem" }} />
          <Box component="span">
            {timeOrDate ? (
              <span>{timeLeft == null ? "N/A" : formatTimeLeft(timeLeft)}</span>
            ) : (
              <Box
                sx={{
                  height: 24,
                  fontSize: "0.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-evenly",
                  alignItems: "center",
                }}
              >
                <span>{comitard.enchereStop ? comitard.enchereStop.toDate().toLocaleDateString() : "N/A"}</span>
                <span>{comitard.enchereStop ? comitard.enchereStop.toDate().toLocaleTimeString() : "N/A"}</span>
              </Box>
            )}
          </Box>
        </Label>
      )}
    </Box>
  );
}