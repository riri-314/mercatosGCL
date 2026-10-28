import { useState } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import Countdown from "../../components/countdown/countdown";
import ClubIcon from "../../components/club-icon/club-icon";
import { formatTimeLeft } from "./results-helper";
import type { ComitardWithMeta } from "../../types/results.types";
import { getLeadingBid } from "../../utils/auction";

type Props = { comitard: ComitardWithMeta; isClosed: boolean };
export function ComitardStatusChips({ comitard, isClosed }: Props) {
  const [timeOrDate, setTimeOrDate] = useState(true);
  const leader = getLeadingBid(comitard.encheres);
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 1.5,
        bgcolor: "background.paper",
        borderRadius: 1.5,
        p: 1,
      }}
    >
      <Box>
        <Typography
          sx={{
            fontSize: 10,
            color: "text.secondary",
            letterSpacing: ".08em",
            mb: 0.5,
          }}
        >
          {isClosed ? "ENCHÈRE GAGNANTE" : "MEILLEURE ENCHÈRE"}
        </Typography>
        <Typography
          sx={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-.05em",
            lineHeight: 1.1,
          }}
        >
          {leader?.vote ?? 0}{" "}
          <Box
            component="span"
            sx={{
              fontSize: 12,
              fontWeight: 400,
              color: "text.secondary",
              letterSpacing: 0,
            }}
          >
            {leader?.vote === 1 ? "fût" : "fûts"}
          </Box>
        </Typography>
      </Box>
      {isClosed ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            bgcolor: "#EAF2DC",
            color: "#426032",
            px: 1.25,
            py: 1,
            borderRadius: 1.25,
            fontSize: 11,
            fontWeight: 700,
            maxWidth: "55%",
          }}
        >
          <ClubIcon name="cup" sx={{ fontSize: 16, flexShrink: 0 }} />
          <Box
            component="span"
            sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {leader?.sender || "Terminée"}
          </Box>
        </Box>
      ) : (
        <ButtonBase
          aria-label={
            timeOrDate
              ? "Afficher la date de fin de l’enchère"
              : "Afficher le temps restant"
          }
          onClick={() => setTimeOrDate((value) => !value)}
          title="Basculer entre le temps restant et la date de fin"
          sx={{
            bgcolor: "#FAEEE3",
            color: "#9B582D",
            borderRadius: 1.25,
            p: 1.1,
            gap: 0.75,
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: "nowrap",
            minHeight: 44,
          }}
        >
          <ClubIcon name="clock" sx={{ fontSize: 16 }} />
          {timeOrDate ? (
            comitard.enchereStop ? (
              <Countdown
                stop={comitard.enchereStop.toMillis()}
                format={formatTimeLeft}
              />
            ) : (
              "—"
            )
          ) : (
            (comitard.enchereStop?.toDate().toLocaleString("fr-BE", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            }) ?? "—")
          )}
        </ButtonBase>
      )}
    </Box>
  );
}
