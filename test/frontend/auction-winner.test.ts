import { expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";
import { getLeadingBid } from "../../src/utils/auction";

it("selects the highest corrected amount without changing chronological history", () => {
  const bids = [
    { sender: "highest", vote: 40, date: new Timestamp(1, 0) },
    { sender: "latest", vote: 20, date: new Timestamp(2, 0) },
  ];
  expect(getLeadingBid(bids)).toBe(bids[0]);
  expect(bids.map(bid => bid.sender)).toEqual(["highest", "latest"]);
});

it("breaks equal amounts by the latest timestamp, preserving sub-second precision", () => {
  const bids = [
    { vote: 40, date: new Timestamp(2, 800_000_000) },
    { vote: 40, date: new Timestamp(2, 900_000_000) },
    { vote: 40, date: new Timestamp(1, 950_000_000) },
  ];
  expect(getLeadingBid(bids)).toBe(bids[1]);
});

it("has no leading bid for an unstarted auction", () => {
  expect(getLeadingBid([])).toBeUndefined();
});
