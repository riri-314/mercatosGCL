import React, { useCallback, useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import { Alert, AlertColor } from "@mui/material";
import { LoadingButton } from "@mui/lab";


import Iconify from "../../components/iconify/iconify";
import Label from "../../components/label/label";
import QuantityInput from "../../components/inputs/numberInput";

import { httpsCallable } from "@firebase/functions";
import { functions } from "../../firebase_config";
import { useAuth } from "../../auth/AuthProvider";

import ComitardModal from "./comitard-modal.tsx";
import FadeImage from "./comitard-picture.tsx";

// ----------------------------------------------------------------------

interface CerclesData {
  [key: string]: { name: string };
}

interface ComitardCardProps {
  product: any;
  user: string | undefined; // (kept for compatibility; actual auth user comes from useAuth)
  cercleId: string;
  editionId: string;
  comitardId: string;
  nbFutsLeft: number;
  enchereMin: number;
  enchereMax: number;
  isInTimeFrame: boolean;
  now: number; // ✅ passed from parent single timer tick
  refetchData: () => void;
  cerclesData: CerclesData;
}

function formatTimeLeft(time: number): string {
  const hours = Math.floor(time / (1000 * 60 * 60));
  const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((time % (1000 * 60)) / 1000);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function ComitardCardInner({
  product,
  cercleId,
  comitardId,
  editionId,
  nbFutsLeft,
  enchereMin,
  enchereMax,
  isInTimeFrame,
  now,
  refetchData,
  cerclesData,
}: ComitardCardProps) {
  const [open, setOpen] = useState(false);
  const [vote, setVote] = useState(0);
  const [voteError, setVoteError] = useState("");
  const [voteErrorSeverity, setVoteErrorSeverity] = useState<
    AlertColor | undefined
  >("error");
  const [loading, setLoading] = useState(false);

  const { user, isAdmin } = useAuth();

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  const enchereStartMs = useMemo(() => {
    const v = product?.enchereStart?.toMillis?.();
    return typeof v === "number" ? v : null;
  }, [product?.enchereStart]);

  const enchereStopMs = useMemo(() => {
    const v = product?.enchereStop?.toMillis?.();
    return typeof v === "number" ? v : null;
  }, [product?.enchereStop]);

  const timeLeft = useMemo(() => {
    if (!enchereStartMs || !enchereStopMs) return 0;
    if (now >= enchereStartMs && now <= enchereStopMs)
      return enchereStopMs - now;
    return 0;
  }, [now, enchereStartMs, enchereStopMs]);

  const encheresArray = useMemo(() => {
    if (!product?.encheres) return [];
    return (Object.values(product.encheres) as any[]).filter((e) => e !== null);
  }, [product?.encheres]);

  const firstEnchere: any = useMemo(() => {
    if (encheresArray.length === 0) return null;

    // Newest first; if same timestamp, higher vote wins
    return [...encheresArray].sort((a: any, b: any) => {
      if (b?.date?.seconds !== a?.date?.seconds) {
        return (b?.date?.seconds ?? 0) - (a?.date?.seconds ?? 0);
      }
      return (b?.vote ?? 0) - (a?.vote ?? 0);
    })[0];
  }, [encheresArray]);

  const maxEnchere = useMemo(() => {
    if (encheresArray.length === 0) return null;
    const votes = encheresArray
      .map((e: any) => e?.vote)
      .filter((v) => typeof v === "number");
    if (votes.length === 0) return null;
    return Math.max(...votes);
  }, [encheresArray]);

  const minEnchere = useMemo(() => {
    if (maxEnchere != null) {
      return Math.min(Math.max(maxEnchere + 1, enchereMin), enchereMax);
    }
    return enchereMin;
  }, [maxEnchere, enchereMin, enchereMax]);

  const isDisabled = useMemo(() => {
    if (maxEnchere != null) return maxEnchere + 1 > enchereMax;
    return false;
  }, [maxEnchere, enchereMax]);

  const displayVote = useMemo(() => {
    // show vote only during overall timeframe + user constraints
    if (!isInTimeFrame) return false;
    if (!user) return false;

    // only vote for a comitard not in the same cercle
    if (user.uid === cercleId) return false;

    // admin has no vote
    if (isAdmin()) return false;

    // must have enough futs
    if (nbFutsLeft <= 0 || nbFutsLeft < enchereMin) return false;

    // if enchère window exists, vote only inside it
    if (enchereStartMs && enchereStopMs) {
      return now >= enchereStartMs && now <= enchereStopMs;
    }

    return true;
  }, [
    isInTimeFrame,
    user,
    cercleId,
    isAdmin,
    nbFutsLeft,
    enchereMin,
    enchereStartMs,
    enchereStopMs,
    now,
  ]);

  const handleVote = useCallback((): void => {
    setLoading(true);
    setVoteError("");
    setVoteErrorSeverity("error");

    if (
      vote &&
      vote > 0 &&
      vote >= enchereMin &&
      enchereMax >= vote &&
      vote <= nbFutsLeft
    ) {
      const Vote = httpsCallable(functions, "vote");
      Vote({
        vote,
        comitardId,
        editionId,
        clientTime: new Date(),
      })
        .then((_result) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          //const data: any = result.data;
          //console.log("vote result:", data);

          setTimeout(() => refetchData(), 2000);

          setVoteErrorSeverity("success");
          setVoteError("Vote enregistré");
          setTimeout(() => setVoteError(""), 4000);
          setLoading(false);
        })
        .catch((error) => {
          const message = error?.message ?? "Erreur inconnue";
          //const details = error?.details;
          //console.log("vote error:", message, details);

          setTimeout(() => refetchData(), 2000);
          setVoteError(message);
          setLoading(false);
        });
    } else {
      setVoteError("Veuillez entrer une enchère valide");
      setLoading(false);
    }
  }, [
    vote,
    enchereMin,
    enchereMax,
    nbFutsLeft,
    comitardId,
    editionId,
    refetchData,
  ]);

  const renderStatus = useMemo(
    () => (
      <Label
        variant="filled"
        color={"error"}
        sx={{
          zIndex: 9,
          top: 16,
          right: 16,
          position: "absolute",
          textTransform: "uppercase",
          boxShadow: (theme: any) => theme.shadows[4],
        }}
      >
        {formatTimeLeft(timeLeft)} <Iconify icon="jam:chronometer" />
      </Label>
    ),
    [timeLeft],
  );

  const renderPrice = useMemo(
    () => (
      <Label
        variant="filled"
        color={"info"}
        sx={{
          zIndex: 9,
          top: 16,
          left: 16,
          position: "absolute",
          textTransform: "uppercase",
          boxShadow: (theme: any) => theme.shadows[4],
        }}
      >
        <Iconify icon="ic:round-show-chart" />
        {!(timeLeft > 0) && product.encheres !== null && <span>win</span>}
        {firstEnchere ? `${firstEnchere.vote} fûts` : "No data"}
      </Label>
    ),
    [firstEnchere, product?.encheres, timeLeft],
  );

  const renderWinner = useMemo(() => {
    const senderId = firstEnchere?.sender as string | undefined;
    const senderName = senderId ? cerclesData?.[senderId]?.name : undefined;

    return (
      <Label
        variant="filled"
        color={"success"}
        sx={{
          zIndex: 9,
          top: 16,
          left: 16,
          position: "absolute",
          textTransform: "uppercase",
          boxShadow: (theme: any) => theme.shadows[4],
        }}
      >
        <Iconify icon="solar:cup-bold" />
        {senderName ?? "No data"}
      </Label>
    );
  }, [firstEnchere, cerclesData]);

  const voteMax = useMemo(
    () => Math.min(nbFutsLeft, enchereMax),
    [nbFutsLeft, enchereMax],
  );

  const won = useMemo(
    () => timeLeft <= 0 && Boolean(product?.encheres),
    [timeLeft, product?.encheres],
  );

  return (
    <>
      <Card>
        <Box onClick={handleOpen} sx={{ pt: "100%", position: "relative" }}>
          {timeLeft > 0 && renderStatus}
          {timeLeft > 0 && renderPrice}
          {timeLeft <= 0 && product.encheres && renderWinner}
          <FadeImage src={product.picture} alt={product.name} absolute />
        </Box>

        {timeLeft > 0 && <LinearProgress color={"error"} />}

        <Stack spacing={2} sx={{ p: 3 }}>
          <Typography variant="h6" noWrap>
            {product.firstname} "{product.nickname}" {product.name}
          </Typography>

          {displayVote && (
            <>
              <QuantityInput
                title="Enchère"
                min={minEnchere}
                max={voteMax}
                error={false}
                helpText={""}
                change={(_event: any, val: any) => setVote(val)}
              />

              <LoadingButton
                onClick={handleVote}
                loading={loading}
                disabled={isDisabled}
                variant="contained"
                size="large"
                color="inherit"
                startIcon={<Iconify icon="solar:user-hand-up-bold-duotone" />}
              >
                {isDisabled ? "Enchére max atteinte" : "Enchérir"}
              </LoadingButton>
            </>
          )}

          {voteError && (
            <Alert sx={{ mt: 3 }} severity={voteErrorSeverity}>
              {voteError}
            </Alert>
          )}
        </Stack>
      </Card>

      {/* Optional perf win: only mount modal when open */}
      <ComitardModal
        open={open}
        onClose={handleClose}
        product={product}
        cercleId={cercleId}
        cerclesData={cerclesData}
        timeLeft={timeLeft}
        renderStatus={renderStatus}
        renderPrice={renderPrice}
        renderWinner={renderWinner}
        displayVote={displayVote}
        minEnchere={minEnchere}
        voteMax={voteMax}
        isDisabled={isDisabled}
        voteError={voteError}
        voteErrorSeverity={voteErrorSeverity}
        loading={loading}
        setVote={setVote}
        handleVote={handleVote}
        won={won}
      />
    </>
  );
}

// ✅ Memoize: ignore `now` ticks unless the card is actively in an enchère window
export default React.memo(ComitardCardInner, (prev, next) => {
  // If the product reference changes, re-render (server data updated)
  if (prev.product !== next.product) return false;

  // If these change, re-render
  if (prev.nbFutsLeft !== next.nbFutsLeft) return false;
  if (prev.enchereMin !== next.enchereMin) return false;
  if (prev.enchereMax !== next.enchereMax) return false;
  if (prev.isInTimeFrame !== next.isInTimeFrame) return false;
  if (prev.cerclesData !== next.cerclesData) return false;
  if (prev.user !== next.user) return false;

  // Ignore `now` unless we are within the active enchère window
  const ps = prev.product?.enchereStart?.toMillis?.() ?? null;
  const pe = prev.product?.enchereStop?.toMillis?.() ?? null;

  if (ps && pe) {
    const prevActive = prev.now >= ps && prev.now <= pe;
    const nextActive = next.now >= ps && next.now <= pe;
    if (prevActive || nextActive) return false; // re-render while active
  }

  return true;
});
