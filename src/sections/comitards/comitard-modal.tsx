import { useMemo } from "react";

import {
  Alert,
  Box,
  Card,
  IconButton,
  Modal,
  Stack,
  Typography,
  type AlertColor,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";

import Iconify from "../../components/iconify/iconify";
import QuantityInput from "../../components/inputs/numberInput";
import EncheresList from "./comitard-encheres";
import FadeImage from "./comitard-picture";
import { campusLabel, formatTimeLeft } from "./comitard-helper";
import ClubIcon from "../../components/club-icon/club-icon";
import Countdown from "../../components/countdown/countdown";
import type { Comitard, Enchere } from "../../types/results.types";
import { getLeadingBid } from "../../utils/auction";

export interface CerclesData {
  [key: string]: { name: string };
}

export interface ComitardModalProps {
  open: boolean;
  onClose: () => void;

  product: Partial<Comitard> & { campus?: number };
  cercleId: string;
  cerclesData: CerclesData;

  timeLeft: number;

  displayVote: boolean;
  minEnchere: number;
  voteMax: number;
  isDisabled: boolean;

  voteError: string;
  voteErrorSeverity: AlertColor;
  loading: boolean;

  setVote: (v: number) => void;
  handleVote: () => void;

  won: boolean;
}

export default function ComitardModal({
  open,
  onClose,
  product,
  cercleId,
  cerclesData,
  timeLeft,
  displayVote,
  minEnchere,
  voteMax,
  isDisabled,
  voteError,
  voteErrorSeverity,
  loading,
  setVote,
  handleVote,
  won,
}: ComitardModalProps) {
  const encheres = useMemo(
    () => Object.values<Enchere>(product?.encheres ?? {}).sort(
      (a, b) => b.date.seconds - a.date.seconds ||
        (b.date.nanoseconds ?? 0) - (a.date.nanoseconds ?? 0) ||
        b.vote - a.vote,
    ),
    [product?.encheres],
  );
  const latest = encheres[0];
  const leader = getLeadingBid(encheres);
  const displayedBid = won ? leader : latest;
  const details = [
    { label: "Poste", value: product?.post },
    { label: "Maison", value: cerclesData[cercleId]?.name },
    { label: "Teneur en taule", value: `${product?.teneurTaule ?? 0} / 10 🍺` },
    { label: "État civil", value: product?.etatCivil },
    { label: "Âge", value: product?.age ? `${product.age} ans` : null },
    { label: "Étoiles", value: product?.nbEtoiles ? "⭐".repeat(product.nbEtoiles) : "0" },
    { label: "Point fort", value: product?.pointFort },
    { label: "Point faible", value: product?.pointFaible },
    { label: "Est le seul", value: product?.estLeSeul },
    { label: "Changer de campus", value: campusLabel(product?.campus) },
  ];

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="comitard-profile-title" sx={{ top: "var(--cercle-session-banner-height, 0px)" }}>
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="comitard-profile-title"
        tabIndex={-1}
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "calc(100% - 24px)", md: "min(720px, 90%)" },
          maxHeight: "calc(100dvh - var(--cercle-session-banner-height, 0px) - 24px)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "none",
          border: "none",
          outline: "none",
        }}
      >
        <Box
          component="header"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: { xs: 2, sm: 3 },
            py: 1.5,
            flexShrink: 0,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 11, color: "text.secondary", mb: 0.25 }}>
              {won ? "Enchère gagnante" : "Dernière enchère"}
            </Typography>
            <Typography sx={{ fontSize: displayedBid ? 24 : 14, fontWeight: 700, lineHeight: 1.3 }}>
              {displayedBid ? (
                <>
                  {displayedBid.vote}{" "}
                  <Box component="span" sx={{ fontSize: 12, fontWeight: 400, color: "text.secondary" }}>
                    {displayedBid.vote === 1 ? "fût" : "fûts"}
                  </Box>
                </>
              ) : "Aucune enchère"}
            </Typography>
          </Box>
          {timeLeft > 0 ? (
            <Box sx={{ minWidth: 0, textAlign: "right" }}>
              <Typography sx={{ fontSize: 11, color: "text.secondary", mb: 0.25 }}>
                Fin de l’enchère
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                {product?.enchereStop?.toDate().toLocaleString("fr-BE", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                <Countdown stop={product?.enchereStop?.toMillis() ?? 0} format={formatTimeLeft} /> restantes
              </Typography>
            </Box>
          ) : won && leader ? (
            <Box sx={{ maxWidth: "40%", minWidth: 0, textAlign: "right" }}>
              <Typography sx={{ fontSize: 11, color: "text.secondary", mb: 0.25 }}>
                Remportée par
              </Typography>
              <Typography sx={{
                fontSize: 12,
                fontWeight: 600,
                color: "success.dark",
                overflowWrap: "anywhere",
              }}>
                {cerclesData[leader.sender]?.name || leader.sender || "—"}
              </Typography>
            </Box>
          ) : null}
          <IconButton
            onClick={onClose}
            aria-label="Fermer la fiche"
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              bgcolor: "background.neutral",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <ClubIcon name="close" />
          </IconButton>
        </Box>

        <Box sx={{ minHeight: 0, overflowY: "auto", overscrollBehavior: "contain" }}>
          <Box sx={{
            height: { xs: "26dvh", sm: "30dvh" },
            maxHeight: 280,
            minHeight: 150,
            position: "relative",
          }}>
            <FadeImage
              src={product?.picture}
              alt={`${product?.firstname ?? ""} ${product?.name ?? ""}`}
              absolute
            />
          </Box>

          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              component="h2"
              id="comitard-profile-title"
              sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 700, overflowWrap: "anywhere" }}
            >
              {product?.firstname} {product?.name}
            </Typography>
            {product?.nickname && (
              <Typography sx={{ mt: 0.5, fontSize: 14, color: "text.secondary", overflowWrap: "anywhere" }}>
                « {product.nickname} »
              </Typography>
            )}

            <Box component="dl" sx={{
              display: "grid",
              gridTemplateColumns: { xs: "100px minmax(0, 1fr)", sm: "150px minmax(0, 1fr)" },
              columnGap: 2,
              my: 2.5,
              fontSize: 13,
              "& dt, & dd": { m: 0, py: 1.25, borderBottom: "1px solid", borderColor: "divider", overflowWrap: "anywhere" },
              "& dt": { color: "text.secondary" },
              "& dd": { fontWeight: 500 },
            }}>
              {details.map(({ label, value }) => (
                <Box component="div" key={label} sx={{ display: "contents" }}>
                  <Box component="dt">{label}</Box>
                  <Box component="dd">{value || "—"}</Box>
                </Box>
              ))}
            </Box>

            {displayVote && (
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <QuantityInput
                  title="Enchère"
                  min={minEnchere}
                  max={voteMax}
                  error={false}
                  helpText=""
                  change={(_event, value) => setVote(value ?? 0)}
                />
                <LoadingButton
                  onClick={handleVote}
                  loading={loading}
                  disabled={isDisabled}
                  variant="contained"
                  fullWidth
                  startIcon={<Iconify icon="solar:user-hand-up-bold-duotone" />}
                >
                  {isDisabled ? "Enchère max atteinte" : "Enchérir"}
                </LoadingButton>
                {voteError && <Alert severity={voteErrorSeverity}>{voteError}</Alert>}
              </Stack>
            )}

            <EncheresList encheres={encheres} cerclesData={cerclesData} won={won} />
          </Box>
        </Box>
      </Card>
    </Modal>
  );
}
