import { useCallback, useEffect, useMemo, useState } from "react";
import { httpsCallable } from "@firebase/functions";

import { functions } from "../../firebase_config";
import { useAuth } from "../../auth/AuthProvider";

import type React from "react";
import type { CerclesData, ComitardModalProps } from "./comitard-modal";

export type Enchere = {
  vote: number;
  sender: string;
  date: { seconds: number };
};

export function formatTimeLeft(time: number): string {
  const hours = Math.floor(time / (1000 * 60 * 60));
  const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((time % (1000 * 60)) / 1000);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function campusLabel(cmp: number | undefined): string {
  if (!cmp) return "Non renseigné";
  if (cmp === 1) return "Possible 👌";
  if (cmp === 2) return "Pas possible 👎";
  if (cmp === 3) return "Bouillant mort! 🔥";
  if (cmp === 4) return "Pas du tout possible 🙅";
  return "Non renseigné";
}

function toMillis(ts: any): number | null {
  const v = ts?.toMillis?.();
  return typeof v === "number" ? v : null;
}

function normalizeEncheres(encheres: any): Enchere[] {
  if (!encheres) return [];
  return (Object.values(encheres) as any[])
    .filter(Boolean)
    .map((e) => ({
      vote: Number(e.vote ?? 0),
      sender: String(e.sender ?? ""),
      date: { seconds: Number(e?.date?.seconds ?? 0) },
    }))
    .filter((e) => Number.isFinite(e.vote) && Boolean(e.sender));
}

export interface UseComitardAuctionArgs {
  product: any;
  cercleId: string;
  comitardId: string;
  editionId: string;

  nbFutsLeft: number;
  enchereMin: number;
  enchereMax: number;
  isInTimeFrame: boolean;
  now: number;

  refetchData: () => void;
}

export interface UseComitardAuctionResult {
  enchereStartMs: number | null;
  enchereStopMs: number | null;

  timeLeft: number; // ms (0 if not active)
  isAuctionActive: boolean;

  encheresArray: Enchere[];
  firstEnchere: Enchere | null;
  maxEnchere: number | null;

  minEnchereComputed: number;
  voteMax: number;
  isDisabled: boolean;
  displayVote: boolean;

  won: boolean;

  vote: number;
  setVote: (v: number) => void;
  loading: boolean;
  voteError: string;
  voteErrorSeverity: "error" | "success";
  handleVote: () => void;
}

export function useComitardAuction({
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
}: UseComitardAuctionArgs): UseComitardAuctionResult {
  const { user, isAdmin } = useAuth();

  const [vote, setVote] = useState(0);
  const [loading, setLoading] = useState(false);
  const [voteError, setVoteError] = useState("");
  const [voteErrorSeverity, setVoteErrorSeverity] = useState<"error" | "success">("error");

  // Reset "form" when switching comitard/product
  useEffect(() => {
    setVote(0);
    setVoteError("");
    setVoteErrorSeverity("error");
    setLoading(false);
  }, [comitardId, product?.picture]);

  const enchereStartMs = useMemo(() => toMillis(product?.enchereStart), [product?.enchereStart]);
  const enchereStopMs = useMemo(() => toMillis(product?.enchereStop), [product?.enchereStop]);

  const isAuctionActive = useMemo(() => {
    if (!enchereStartMs || !enchereStopMs) return false;
    return now >= enchereStartMs && now <= enchereStopMs;
  }, [now, enchereStartMs, enchereStopMs]);

  const timeLeft = useMemo(() => {
    if (!enchereStartMs || !enchereStopMs) return 0;
    if (now >= enchereStartMs && now <= enchereStopMs) return enchereStopMs - now;
    return 0;
  }, [now, enchereStartMs, enchereStopMs]);

  const encheresArray = useMemo(() => normalizeEncheres(product?.encheres), [product?.encheres]);

  const firstEnchere = useMemo<Enchere | null>(() => {
    if (encheresArray.length === 0) return null;
    // newest first; tie-break: highest vote
    return [...encheresArray].sort((a, b) => {
      if (b.date.seconds !== a.date.seconds) return b.date.seconds - a.date.seconds;
      return b.vote - a.vote;
    })[0];
  }, [encheresArray]);

  const maxEnchere = useMemo(() => {
    if (encheresArray.length === 0) return null;
    let m = -Infinity;
    for (const e of encheresArray) m = Math.max(m, e.vote);
    return Number.isFinite(m) ? m : null;
  }, [encheresArray]);

  const minEnchereComputed = useMemo(() => {
    if (maxEnchere != null) return Math.min(Math.max(maxEnchere + 1, enchereMin), enchereMax);
    return enchereMin;
  }, [maxEnchere, enchereMin, enchereMax]);

  const voteMax = useMemo(() => Math.min(nbFutsLeft, enchereMax), [nbFutsLeft, enchereMax]);

  const isDisabled = useMemo(() => {
    if (maxEnchere != null) return maxEnchere + 1 > enchereMax;
    return false;
  }, [maxEnchere, enchereMax]);

  const displayVote = useMemo(() => {
    if (!isInTimeFrame) return false;
    if (!user) return false;

    // Can't vote for your own cercle
    if (user.uid === cercleId) return false;

    // Admin has no vote
    if (isAdmin()) return false;

    // Must have enough futs for minimum bid
    if (nbFutsLeft <= 0 || nbFutsLeft < enchereMin) return false;

    // If auction window exists, vote only while active
    if (enchereStartMs && enchereStopMs) return isAuctionActive;

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
    isAuctionActive,
  ]);

  const won = useMemo(() => timeLeft <= 0 && Boolean(product?.encheres), [timeLeft, product?.encheres]);

  const handleVote = useCallback(() => {
    setLoading(true);
    setVoteError("");
    setVoteErrorSeverity("error");

    const isValid =
      vote > 0 &&
      vote >= enchereMin &&
      vote <= enchereMax &&
      vote <= nbFutsLeft;

    if (!isValid) {
      setVoteError("Veuillez entrer une enchère valide");
      setLoading(false);
      return;
    }

    const Vote = httpsCallable(functions, "vote");
    Vote({
      vote,
      comitardId,
      editionId,
      clientTime: new Date(),
    })
      .then(() => {
        setTimeout(() => refetchData(), 2000);
        setVoteErrorSeverity("success");
        setVoteError("Vote enregistré");
        setTimeout(() => setVoteError(""), 4000);
        setLoading(false);
      })
      .catch((error) => {
        setTimeout(() => refetchData(), 2000);
        setVoteError(error?.message ?? "Erreur inconnue");
        setLoading(false);
      });
  }, [vote, enchereMin, enchereMax, nbFutsLeft, comitardId, editionId, refetchData]);

  return {
    enchereStartMs,
    enchereStopMs,
    timeLeft,
    isAuctionActive,

    encheresArray,
    firstEnchere,
    maxEnchere,

    minEnchereComputed,
    voteMax,
    isDisabled,
    displayVote,

    won,

    vote,
    setVote,
    loading,
    voteError,
    voteErrorSeverity,
    handleVote,
  };
}

/**
 * Modal props builder (no duplication in card/other components)
 */
export interface BuildComitardModalPropsArgs {
  open: boolean;
  onClose: () => void;

  product: any;
  cercleId: string;
  cerclesData: CerclesData;

  auction: UseComitardAuctionResult;

  renderStatus: React.ReactNode;
  renderPrice: React.ReactNode;
  renderWinner: React.ReactNode;
}

export function buildComitardModalProps({
  open,
  onClose,
  product,
  cercleId,
  cerclesData,
  auction,
  renderStatus,
  renderPrice,
  renderWinner,
}: BuildComitardModalPropsArgs): ComitardModalProps {
  return {
    open,
    onClose,

    product,
    cercleId,
    cerclesData,

    timeLeft: auction.timeLeft,
    renderStatus,
    renderPrice,
    renderWinner,

    displayVote: auction.displayVote,
    minEnchere: auction.minEnchereComputed,
    voteMax: auction.voteMax,
    isDisabled: auction.isDisabled,

    voteError: auction.voteError,
    voteErrorSeverity: auction.voteErrorSeverity,
    loading: auction.loading,

    setVote: auction.setVote,
    handleVote: auction.handleVote,

    won: auction.won,
  };
}