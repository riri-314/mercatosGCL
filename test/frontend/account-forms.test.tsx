import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Timestamp } from "firebase/firestore";
import NewEdition from "../../src/sections/admin-account/new_edition";
import EditCercle from "../../src/sections/admin-account/edit_cercle";

vi.mock("../../src/utils/admin-tools", () => ({
  editEdition: vi.fn(),
  newEdition: vi.fn(),
}));

vi.mock("../../src/components/inputs/mdInput", () => ({
  default: ({
    markdown,
    setRules,
  }: {
    markdown: string;
    setRules: (value: string) => void;
  }) => (
    <textarea
      aria-label="Règlement"
      value={markdown}
      onChange={(event) => setRules(event.target.value)}
    />
  ),
}));

it("shows the actual starting values in a new edition form", () => {
  render(<NewEdition data={{}} refetchData={vi.fn()} />);
  for (const [label, value] of Object.entries({
    "Fûts par cercle": "100",
    "Comitards par cercle": "5",
    "Durée d'une enchère": "16",
    "Enchère minimum": "1",
    "Enchere maximum": "100",
  }))
    expect(screen.getByLabelText(label)).toHaveValue(value);
});

it("keeps valid zero refund percentages when editing an edition", () => {
  render(
    <NewEdition
      updateMode
      data={{
        rules: "Rules",
        start: Timestamp.fromMillis(Date.now()),
        stop: Timestamp.fromMillis(Date.now() + 86400000),
        remboursementVendeur: 0,
        remboursementPerdant: 0,
        remboursementGagnant: 0,
      }}
      refetchData={vi.fn()}
    />,
  );
  for (const name of ["Cercle vendeur", "Cercle perdant", "Cercle gagnant"]) {
    expect(screen.getByRole("combobox", { name })).toHaveTextContent("0%");
  }
});

it("allows a circle’s valid empty balance to remain zero after focusing and leaving the field", async () => {
  const user = userEvent.setup();
  render(
    <EditCercle
      data={{
        id: "circle",
        name: "Circle",
        description: "Description",
        nbFut: 0,
      }}
      editionId="edition"
      close={vi.fn()}
      refetchData={vi.fn()}
    />,
  );
  const balance = screen.getByLabelText("Nombre de futs");
  await user.click(balance);
  await user.tab();
  expect(balance).toHaveValue("0");
});
