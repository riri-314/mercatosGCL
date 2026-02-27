import React, { useMemo } from "react";

import {
  Alert,
  Box,
  Card,
  Divider,
  LinearProgress,
  Modal,
  Stack,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import Iconify from "../../components/iconify/iconify";
import QuantityInput from "../../components/inputs/numberInput";
import EncheresList from "./comitard-encheres";
import FadeImage from "./comitard-picture";

interface CerclesData {
  [key: string]: { name: string };
}

interface ComitardModalProps {
  open: boolean;
  onClose: () => void;

  product: any;
  cercleId: string;
  cerclesData: CerclesData;

  timeLeft: number;
  renderStatus: React.ReactNode;
  renderPrice: React.ReactNode;
  renderWinner: React.ReactNode;

  displayVote: boolean;
  minEnchere: number;
  voteMax: number;
  isDisabled: boolean;

  voteError: string;
  voteErrorSeverity: any;
  loading: boolean;

  setVote: (v: number) => void;
  handleVote: () => void;

  won: boolean;
}

function campusLabel(cmp: number | undefined): string {
  if (!cmp) return "Non renseigné";
  if (cmp === 1) return "Possible 👌";
  if (cmp === 2) return "Pas possible 👎";
  if (cmp === 3) return "Bouillant mort! 🔥";
  if (cmp === 4) return "Pas du tout possible 🙅";
  return "Non renseigné";
}

export default function ComitardModal({
  open,
  onClose,
  product,
  cercleId,
  cerclesData,
  timeLeft,
  renderStatus,
  renderPrice,
  renderWinner,
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
  const theme = useTheme();
  const isMediumScreen = useMediaQuery(theme.breakpoints.down("md"));

  const style = useMemo(
    () => ({
      position: "absolute" as const,
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: isMediumScreen ? "90%" : "50%",
      height: "90vh",
      boxShadow: "none",
      border: "none",
      outline: "none",
    }),
    [isMediumScreen],
  );

  return (
    <Modal open={open} onClose={onClose}>
      <Card sx={style}>
        <Box sx={{ pt: "40vh", position: "relative" }}>
          {timeLeft > 0 && renderStatus}
          {timeLeft > 0 && renderPrice}
          {timeLeft <= 0 && product.encheres && renderWinner}
          <FadeImage src={product.picture} alt={product.name} absolute />
        </Box>

        {timeLeft > 0 && <LinearProgress color="error" />}

        <Box
          sx={{
            p: (theme) => theme.spacing(3),
            maxHeight: "50vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h3">
            {product.firstname} "{product.nickname}" {product.name}
          </Typography>

          <Divider sx={{ my: 1 }} />

          <Stack spacing={1}>
            <Typography>
              <strong>Poste</strong> : {product.post}
              <br />
              <strong>Maison</strong> : {cerclesData?.[cercleId]?.name ?? "—"}
              <br />
              <strong>Teneur en taule</strong> :
              {Array.from({ length: product.teneurTaule ?? 0 }, (_, i) => (
                <span key={i}> 🍺</span>
              ))}
              <br />
              <strong>État civil</strong> : {product.etatCivil}
              <br />
              <strong>Age</strong> : {product.age}
              <br />
              <strong>Point fort</strong> : {product.pointFort}
              <br />
              <strong>Point faible</strong> : {product.pointFaible}
              <br />
              <strong>Campus</strong> : {campusLabel(product.campus)}
            </Typography>

            {displayVote && (
              <>
                <QuantityInput
                  title="Enchère"
                  min={minEnchere}
                  max={voteMax}
                  error={false}
                  helpText=""
                  change={(_e: any, val: any) => setVote(val)}
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

                {voteError && (
                  <Alert severity={voteErrorSeverity}>{voteError}</Alert>
                )}
              </>
            )}

            <EncheresList
              encheres={product.encheres}
              cerclesData={cerclesData}
              won={won}
            />

            <LoadingButton
              onClick={onClose}
              variant="contained"
              color="error"
              fullWidth
            >
              Fermer
            </LoadingButton>
          </Stack>
        </Box>
      </Card>
    </Modal>
  );
}
