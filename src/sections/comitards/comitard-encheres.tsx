import { Box, Typography } from "@mui/material";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import ClubIcon from "../../components/club-icon/club-icon";
import type { Enchere } from "../../types/results.types";
import type { CerclesData } from "./comitard-modal";
import { getLeadingBid } from "../../utils/auction";

interface EncheresListProps {
  encheres: Enchere[];
  cerclesData: CerclesData;
  won: boolean;
}

export default function EncheresList({ encheres, cerclesData, won }: EncheresListProps) {
  const leader = getLeadingBid(encheres);
  return (
    <Box component="section" aria-labelledby="bid-history-title">
      <Typography component="h3" id="bid-history-title" sx={{ fontSize: 15, fontWeight: 700, mb: 1.5 }}>
        Historique des enchères
        <Box component="span" sx={{ ml: 1, fontSize: 12, fontWeight: 400, color: "text.secondary" }}>
          {encheres.length} offre{encheres.length !== 1 ? "s" : ""}
        </Box>
      </Typography>
      {encheres.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: "text.secondary", py: 2 }}>
          Aucune enchère pour le moment.
        </Typography>
      ) : (
        <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
          <Table size="small" aria-label="Historique des enchères" sx={{
            tableLayout: "fixed",
            "& th, & td": { px: 1.5, py: 1.25, fontSize: 12, borderColor: "divider" },
            "& tr:last-child td, & tr:last-child th": { borderBottom: 0 },
          }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: { xs: "65%", sm: "45%" } }}>Cercle</TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" }, width: "30%" }}>Date</TableCell>
                <TableCell align="right">Enchère</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {encheres.map((bid, index) => {
                const isLeader = bid === leader;
                const date = bid.date.toDate();
                const gaps = [encheres[index - 1], encheres[index + 1]]
                  .filter((neighbor) => neighbor != null)
                  .map((neighbor) => Math.abs(neighbor.date.toMillis() - bid.date.toMillis()));
                const showSeconds = gaps.some((gap) => gap < 60_000);
                const showMilliseconds = gaps.some((gap) => gap < 1000);
                const formattedDate = date.toLocaleString("fr-BE", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  ...(showSeconds && { second: "2-digit" }),
                  ...(showMilliseconds && { fractionalSecondDigits: 3 }),
                });
                const exactDate = date.toLocaleString("fr-BE", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  fractionalSecondDigits: 3,
                });
                return (
                  <TableRow key={index} sx={{ bgcolor: isLeader ? "action.hover" : "transparent" }}>
                    <TableCell component="th" scope="row">
                      <Box sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                        {cerclesData[bid.sender]?.name || bid.sender || "—"}
                      </Box>
                      {isLeader && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25, fontSize: 11, color: won ? "success.dark" : "primary.main" }}>
                          {won && <ClubIcon name="cup" sx={{ fontSize: 13 }} />}
                          {won ? "Remportée" : "En tête"}
                        </Box>
                      )}
                      <Box component="time" dateTime={date.toISOString()} title={exactDate} sx={{ display: { xs: "block", sm: "none" }, fontSize: 11, color: "text.secondary", mt: 0.5, fontVariantNumeric: "tabular-nums" }}>
                        {formattedDate}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: "none", sm: "table-cell" }, color: "text.secondary" }}>
                      <time dateTime={date.toISOString()} title={exactDate}>{formattedDate}</time>
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", fontWeight: isLeader ? 700 : 500 }}>
                      {bid.vote} <Box component="span" sx={{ fontSize: 11, fontWeight: 400, color: "text.secondary" }}>{bid.vote === 1 ? "fût" : "fûts"}</Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
