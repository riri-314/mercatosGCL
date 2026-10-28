import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { Timestamp } from "firebase/firestore";
import { useData } from "../../src/data/DataProvider";
import { useAuth } from "../../src/auth/AuthProvider";
import ResultsPage from "../../src/sections/results/results";
import type { ComitardWithMeta } from "../../src/types/results.types";

vi.mock("../../src/data/DataProvider", () => ({ useData: vi.fn() }));
vi.mock("../../src/auth/AuthProvider", () => ({ useAuth: vi.fn() }));
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
  vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, isAdmin: () => false });
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

function setAuctions(state: "empty" | "running" | "finished") {
  const current = vi.mocked(useData)();
  const edition = current.data!.data();
  const cercles = edition.cercles as Record<string, {
    comitards: Record<string, { enchereStop?: Timestamp; encheres?: unknown }>;
  }>;
  for (const cercle of Object.values(cercles)) {
    for (const profile of Object.values(cercle.comitards)) {
      if (state === "empty") {
        delete profile.enchereStop;
        delete profile.encheres;
      } else {
        profile.enchereStop = Timestamp.fromMillis(Date.now() + (state === "running" ? 60000 : -60000));
      }
    }
  }
  vi.mocked(useData).mockReturnValue({ ...current, data: { data: () => edition } });
}

it("shows a simple welcome using the signed-in circle name", () => {
  vi.mocked(useAuth).mockReturnValue({
    user: { uid: "first" } as NonNullable<ReturnType<typeof useAuth>["user"]>,
    loading: false,
    isAdmin: () => false,
  });
  renderResults();
  expect(screen.getByText("Bonjour, Cercle Alpha.")).toBeInTheDocument();
});

it("shows a useful first-auction state without empty search or sort controls", async () => {
  setAuctions("empty");
  const user = renderResults();
  expect(screen.getByRole("heading", { name: "Pas encore d’enchères" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Voir les comitards" })).toHaveAttribute("href", "/comitards");
  expect(screen.queryByRole("textbox", { name: "Rechercher une enchère" })).not.toBeInTheDocument();
  expect(screen.queryByRole("combobox", { name: "Trier les enchères" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("tab", { name: "Enchères remportées" }));
  expect(screen.getByRole("heading", { name: "Pas encore d’enchères" })).toBeInTheDocument();
});

it("links directly to the winners when all auctions have finished", async () => {
  setAuctions("finished");
  const user = renderResults();
  expect(screen.getByRole("heading", { name: "Toutes les enchères sont terminées" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Voir les enchères remportées" }));
  expect(screen.getByRole("tab", { name: "Enchères remportées" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getAllByRole("article")).toHaveLength(3);
});

it("offers the running auctions when none have been won yet", async () => {
  setAuctions("running");
  const user = renderResults();
  await user.click(screen.getByRole("tab", { name: "Enchères remportées" }));
  expect(screen.getByRole("heading", { name: "Aucune enchère remportée" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Voir les enchères en cours" }));
  expect(screen.getAllByRole("article")).toHaveLength(3);
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
