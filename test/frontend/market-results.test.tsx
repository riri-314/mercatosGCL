import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { Timestamp } from "firebase/firestore";
import { useData } from "../../src/data/DataProvider";
import ResultsPage from "../../src/sections/results/results";
import type { ComitardWithMeta } from "../../src/types/results.types";

vi.mock("../../src/data/DataProvider", () => ({ useData: vi.fn() }));
vi.mock("../../src/components/data-refresh/data-refresh", () => ({
  default: () => null,
}));
vi.mock("../../src/sections/results/results-card", () => ({
  ComitardResultCard: ({ comitard }: { comitard: ComitardWithMeta }) => (
    <article aria-label={comitard.firstname}>
      {comitard.firstname} · {comitard.cercle}
    </article>
  ),
}));

beforeEach(() => {
  const now = Date.now();
  const profile = (firstname: string, vote: number, stop: number) => ({
    firstname,
    name: "Demo",
    nickname: firstname,
    enchereStop: Timestamp.fromMillis(stop),
    encheres: {
      first: { sender: "buyer", vote, date: Timestamp.fromMillis(now - 1000) },
    },
  });
  vi.mocked(useData).mockReturnValue({
    data: {
      data: () => ({
        start: Timestamp.fromMillis(now - 10000),
        stop: Timestamp.fromMillis(now + 600000),
        cercles: {
          first: {
            name: "Cercle Alpha",
            comitards: { alice: profile("Élodie", 2, now + 60000) },
          },
          second: {
            name: "Cercle Beta",
            comitards: {
              bob: profile("Jules", 9, now + 120000),
              closed: profile("Camille", 5, now - 1000),
            },
          },
        },
      }),
    },
    refetchData: vi.fn(),
    fetchedTime: now,
  });
});

function renderResults() {
  render(
    <MemoryRouter>
      <ResultsPage />
    </MemoryRouter>,
  );
  return userEvent.setup();
}

it("finds names without accents and also searches circle names", async () => {
  const user = renderResults();
  const search = screen.getByRole("textbox", {
    name: "Rechercher une enchère",
  });
  await user.type(search, "elodie");
  expect(screen.getByRole("article", { name: "Élodie" })).toBeInTheDocument();
  expect(
    screen.queryByRole("article", { name: "Jules" }),
  ).not.toBeInTheDocument();
  await user.clear(search);
  await user.type(search, "beta");
  expect(screen.getByRole("article", { name: "Jules" })).toBeInTheDocument();
  expect(
    screen.queryByRole("article", { name: "Élodie" }),
  ).not.toBeInTheDocument();
});

it("can clear an unsuccessful search and return to all running auctions", async () => {
  const user = renderResults();
  await user.type(
    screen.getByRole("textbox", { name: "Rechercher une enchère" }),
    "missing",
  );
  expect(
    screen.getByRole("heading", { name: "Aucune enchère trouvée" }),
  ).toBeInTheDocument();
  await user.click(
    within(screen.getByRole("tabpanel")).getByRole("button", {
      name: "Effacer la recherche",
    }),
  );
  expect(screen.getAllByRole("article")).toHaveLength(2);
});

it("orders bids by value when requested and keeps closed auctions in their own tab", async () => {
  const user = renderResults();
  expect(
    screen
      .getAllByRole("article")
      .map((card) => card.getAttribute("aria-label")),
  ).toEqual(["Élodie", "Jules"]);
  await user.click(
    screen.getByRole("combobox", { name: "Trier les enchères" }),
  );
  await user.click(
    screen.getByRole("option", { name: "Enchères les plus élevées" }),
  );
  expect(
    screen
      .getAllByRole("article")
      .map((card) => card.getAttribute("aria-label")),
  ).toEqual(["Jules", "Élodie"]);
  await user.click(screen.getByRole("tab", { name: "Enchères remportées" }));
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(screen.getByRole("article", { name: "Camille" })).toBeInTheDocument();
});
