import Countdown from "../../components/countdown/countdown";
import React, { useCallback, useMemo, useState } from "react";

import { Box, Card, Stack, Typography, LinearProgress, Alert } from "@mui/material";
import { LoadingButton } from "@mui/lab";

import Iconify from "../../components/iconify/iconify";
import Label from "../../components/label/label";
import QuantityInput from "../../components/inputs/numberInput";

import ComitardModal from "./comitard-modal";
import { buildComitardModalProps, formatTimeLeft, useComitardAuction } from "./comitard-helper";

import type { AlertColor } from "@mui/material";
import type { CerclesData } from "./comitard-modal";
import FadeImage from "./comitard-picture";

interface ComitardCardProps {
  product: any;
  user: string | undefined; // kept for compatibility, not used (auth comes from hook via useAuth)
  cercleId: string;
  editionId: string;
  comitardId: string;
  nbFutsLeft: number;
  enchereMin: number;
  enchereMax: number;
  isInTimeFrame: boolean;
  refetchData: () => void;
  cerclesData: CerclesData;
}

function ComitardCardInner({
  product,
  cercleId,
  editionId,
  comitardId,
  nbFutsLeft,
  enchereMin,
  enchereMax,
  isInTimeFrame,
  refetchData,
  cerclesData,
}: ComitardCardProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  const auction = useComitardAuction({
    product,
    cercleId,
    comitardId,
    editionId,
    nbFutsLeft,
    enchereMin,
    enchereMax,
    isInTimeFrame,
      refetchData,
  });

  const renderStatus = useMemo(
    () => (
      <Label
        variant="filled"
        color="error"
        sx={{
          zIndex: 9,
          top: 16,
          right: 16,
          position: "absolute",
          textTransform: "uppercase",
          boxShadow: (t: any) => t.shadows[4],
        }}
      >
        <Countdown stop={auction.enchereStopMs ?? 0} format={formatTimeLeft} /> <Iconify icon="jam:chronometer" />
      </Label>
    ),
    [auction.enchereStopMs]
  );

  const renderPrice = useMemo(() => {
    const current = auction.firstEnchere ? `${auction.firstEnchere.vote} fûts` : "No data";

    return (
      <Label
        variant="filled"
        color="info"
        sx={{
          zIndex: 9,
          top: 16,
          left: 16,
          position: "absolute",
          textTransform: "uppercase",
          boxShadow: (t: any) => t.shadows[4],
        }}
      >
        <Iconify icon="ic:round-show-chart" />
        {current}
      </Label>
    );
  }, [auction.firstEnchere]);

  const renderWinner = useMemo(() => {
    const senderId = auction.firstEnchere?.sender as string | undefined;
    const senderName = senderId ? cerclesData?.[senderId]?.name : undefined;

    return (
      <Label
        variant="filled"
        color="success"
        sx={{
          zIndex: 9,
          top: 16,
          left: 16,
          position: "absolute",
          textTransform: "uppercase",
          boxShadow: (t: any) => t.shadows[4],
        }}
      >
        <Iconify icon="solar:cup-bold" />
        {senderName ?? "No data"}
      </Label>
    );
  }, [auction.firstEnchere, cerclesData]);

  const modalProps = useMemo(
    () =>
      buildComitardModalProps({
        open,
        onClose: handleClose,
        product,
        cercleId,
        cerclesData,
        auction,
        renderStatus,
        renderPrice,
        renderWinner,
      }),
    [open, handleClose, product, cercleId, cerclesData, auction, renderStatus, renderPrice, renderWinner]
  );

  // for the small card inline alert, keep compatibility with MUI AlertColor
  const voteErrorSeverity = auction.voteErrorSeverity as AlertColor;

  return (
    <>
      <Card>
        <Box onClick={handleOpen} sx={{ pt: "100%", position: "relative" }}>
          <FadeImage src={product?.picture} alt={product?.name ?? ""} absolute />

          {auction.timeLeft > 0 && renderStatus}
          {auction.timeLeft > 0 && renderPrice}
          {auction.timeLeft <= 0 && product?.encheres && renderWinner}
        </Box>

        {auction.timeLeft > 0 && <LinearProgress color="error" />}

        <Stack spacing={2} sx={{ p: 3 }}>
          <Typography variant="h6" noWrap>
            {product?.firstname} "{product?.nickname}" {product?.name}
          </Typography>

          {auction.displayVote && (
            <>
              <QuantityInput
                title="Enchère"
                min={auction.minEnchereComputed}
                max={auction.voteMax}
                error={false}
                helpText=""
                change={(_event: any, val: any) => auction.setVote(val)}
              />

              <LoadingButton
                onClick={auction.handleVote}
                loading={auction.loading}
                disabled={auction.isDisabled}
                variant="contained"
                size="large"
                color="inherit"
                startIcon={<Iconify icon="solar:user-hand-up-bold-duotone" />}
              >
                {auction.isDisabled ? "Enchére max atteinte" : "Enchérir"}
              </LoadingButton>
            </>
          )}

          {auction.voteError && (
            <Alert sx={{ mt: 3 }} severity={voteErrorSeverity}>
              {auction.voteError}
            </Alert>
          )}
        </Stack>
      </Card>

      {/* Only mount modal when open (lighter) */}
      {open && <ComitardModal {...modalProps} />}
    </>
  );
}

export default React.memo(ComitardCardInner);
