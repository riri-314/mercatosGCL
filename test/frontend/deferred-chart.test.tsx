import { act, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Timestamp } from "firebase/firestore";
import type { ComitardWithMeta } from "../../src/types/results.types";
import { ComitardResultCard } from "../../src/sections/results/results-card";

vi.mock("../../src/sections/results/results-comitard-shart", () => ({
  ComitardBidChart: () => <div>Auction chart</div>,
}));

it("defers charts until the card approaches the viewport", async () => {
  let intersect: IntersectionObserverCallback = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersect = callback;
      }
      observe = vi.fn();
      disconnect = disconnect;
    },
  );
  try {
    const profile: ComitardWithMeta = {
      firstname: "Demo",
      name: "Person",
      nickname: "Example",
      cercle: "Circle",
      picture: "",
      nbEtoiles: 0,
      age: 20,
      enchereProcessed: false,
      enchereStart: undefined,
      enchereStop: Timestamp.fromMillis(Date.now() + 60000),
      encheres: [
        {
          sender: "First circle",
          vote: 1,
          date: Timestamp.fromMillis(Date.now() - 2000),
        },
        {
          sender: "Second circle",
          vote: 2,
          date: Timestamp.fromMillis(Date.now() - 1000),
        },
      ],
      estLeSeul: "Example",
      etatCivil: "Example",
      pointFaible: "Example",
      pointFort: "Example",
      post: "Member",
      teneurTaule: 1,
    };
    render(<ComitardResultCard comitard={profile} />);
    expect(screen.queryByText("Auction chart")).not.toBeInTheDocument();
    act(() =>
      intersect(
        [{ isIntersecting: true }] as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      ),
    );
    expect(await screen.findByText("Auction chart")).toBeInTheDocument();
    expect(disconnect).toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
  }
});
