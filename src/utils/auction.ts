interface AuctionBid {
  vote: number;
  date: { seconds?: number; nanoseconds?: number; toMillis?: () => number };
}

/** Settlement awards the highest amount, breaking ties with the newest bid. */
export function getLeadingBid<T extends AuctionBid>(bids: readonly T[]): T | undefined {
  return bids.reduce<T | undefined>((leader, bid) => {
    if (!leader || bid.vote > leader.vote) return bid;
    if (bid.vote < leader.vote) return leader;
    const date = bid.date;
    const previous = leader.date;
    const newer = typeof date.seconds === "number" && typeof previous.seconds === "number"
      ? date.seconds - previous.seconds || (date.nanoseconds ?? 0) - (previous.nanoseconds ?? 0)
      : (date.toMillis?.() ?? 0) - (previous.toMillis?.() ?? 0);
    return newer > 0 ? bid : leader;
  }, undefined);
}
