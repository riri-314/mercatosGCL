import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Timestamp } from "firebase/firestore";
import { expect, it, vi } from "vitest";
import ComitardModal, { type ComitardModalProps } from "../../src/sections/comitards/comitard-modal";
import { ComitardStatusChips } from "../../src/sections/results/results-comitard-status-ship";
import type { ComitardWithMeta } from "../../src/types/results.types";

function props(overrides: Partial<ComitardModalProps> = {}): ComitardModalProps {
  const now = Date.now();
  return {
    open: true,
    onClose: vi.fn(),
    product: {
      firstname: "Camille", name: "Exemple", nickname: "La relève", post: "Membre du comité",
      enchereStop: Timestamp.fromMillis(now + 60000),
      encheres: {
        older: { sender: "alpha", vote: 5, date: new Timestamp(1, 0) },
        tied: { sender: "alpha", vote: 8, date: new Timestamp(2, 0) },
        latest: { sender: "beta", vote: 9, date: new Timestamp(2, 0) },
      },
    },
    cercleId: "seller",
    cerclesData: { alpha: { name: "Cercle Alpha" }, beta: { name: "Cercle Beta" }, seller: { name: "Cercle Gamma" } },
    timeLeft: 60000,
    displayVote: false, minEnchere: 10, voteMax: 100, isDisabled: false,
    voteError: "", voteErrorSeverity: "error", loading: false,
    setVote: vi.fn(), handleVote: vi.fn(), won: false,
    ...overrides,
  };
}

it("keeps the newest bid consistent between the header and the first history row", () => {
  render(<ComitardModal {...props()} />);
  const dialog = screen.getByRole("dialog", { name: "Camille Exemple" });
  const header = within(dialog.querySelector("header")!);
  expect(header.getByText("Dernière enchère")).toBeInTheDocument();
  expect(header.getByText("9")).toBeInTheDocument();
  expect(header.getByText("Fin de l’enchère")).toBeInTheDocument();
  const rows = within(screen.getByRole("table", { name: "Historique des enchères" })).getAllByRole("row");
  expect(rows[1]).toHaveTextContent("Cercle Beta");
  expect(rows[1]).toHaveTextContent("9 fûts");
  expect(rows[2]).toHaveTextContent("8 fûts");
});

it.each([undefined, {}, []])("handles a profile with no bids (%j)", (encheres) => {
  const options = props();
  options.product.encheres = encheres;
  render(<ComitardModal {...options} timeLeft={0} />);
  expect(screen.getByText("Aucune enchère")).toBeInTheDocument();
  expect(screen.getByText("Aucune enchère pour le moment.")).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.queryByText("Remportée par")).not.toBeInTheDocument();
});

it("supports the normalized bid arrays opened from the results page", () => {
  const options = props();
  options.product.encheres = Object.values(options.product.encheres!);
  render(<ComitardModal {...options} timeLeft={0} won />);
  const header = within(screen.getByRole("dialog").querySelector("header")!);
  expect(header.getByText("Remportée par")).toBeInTheDocument();
  expect(header.getByText("Cercle Beta")).toBeInTheDocument();
  expect(screen.getByText("Remportée", { exact: true })).toBeInTheDocument();
});

it("keeps one close button and preserves bid submission", async () => {
  const options = props({ displayVote: true });
  const user = userEvent.setup();
  render(<ComitardModal {...options} />);
  expect(screen.queryByRole("button", { name: "Fermer" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Enchérir" }));
  expect(options.handleVote).toHaveBeenCalledOnce();
  await user.click(screen.getByRole("button", { name: "Fermer la fiche" }));
  expect(options.onClose).toHaveBeenCalledOnce();
});


it("announces the highest corrected bid and marks its chronological history row as the winner", () => {
  const options = props({ timeLeft: 0, won: true });
  options.product.encheres = {
    highest: { sender: "alpha", vote: 40, date: new Timestamp(1, 0) },
    latest: { sender: "beta", vote: 20, date: new Timestamp(2, 0) },
  };
  render(<ComitardModal {...options} />);
  const header = within(screen.getByRole("dialog").querySelector("header")!);
  expect(header.getByText("Cercle Alpha")).toBeInTheDocument();
  expect(header.getByText("40")).toBeInTheDocument();
  expect(header.getByText("Enchère gagnante")).toBeInTheDocument();
  const rows = within(screen.getByRole("table")).getAllByRole("row");
  expect(rows[1]).toHaveTextContent("Cercle Beta");
  expect(within(rows[1]).queryByText("Remportée")).not.toBeInTheDocument();
  expect(rows[2]).toHaveTextContent("Cercle Alpha");
  expect(within(rows[2]).getByText("Remportée")).toBeInTheDocument();
});

it("shows the actual winning amount and circle on a closed results card", () => {
  const comitard = {
    ...props().product,
    encheres: [
      { sender: "Cercle Alpha", vote: 40, date: new Timestamp(1, 0) },
      { sender: "Cercle Beta", vote: 20, date: new Timestamp(2, 0) },
    ],
  } as ComitardWithMeta;
  render(<ComitardStatusChips comitard={comitard} isClosed />);
  expect(screen.getByText("40")).toBeInTheDocument();
  expect(screen.getByText("Cercle Alpha")).toBeInTheDocument();
  expect(screen.queryByText("Cercle Beta")).not.toBeInTheDocument();
});
