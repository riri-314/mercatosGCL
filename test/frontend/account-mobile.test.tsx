import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { updateDoc } from "firebase/firestore";
import { useAuth } from "../../src/auth/AuthProvider";
import AccountTabs from "../../src/components/account/account-tabs";
import MobileRecordList from "../../src/components/account/mobile-record-list";
import RecordCard from "../../src/components/account/record-card";
import FormDialog from "../../src/components/account/form-dialog";
import ComitardTable from "../../src/sections/admin-account/comitard_table";

vi.mock("../../src/auth/AuthProvider", () => ({ useAuth: vi.fn() }));
vi.mock("firebase/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase/firestore")>()),
  doc: vi.fn(() => "edition-reference"),
  deleteField: vi.fn(() => "DELETE"),
  updateDoc: vi.fn(),
}));
vi.mock("../../src/components/iconify/iconify", () => ({
  default: () => null,
}));

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("max-width"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
  vi.mocked(useAuth).mockReturnValue({
    user: { uid: "first" } as NonNullable<ReturnType<typeof useAuth>["user"]>,
    loading: false,
    isAdmin: () => true,
  });
  vi.mocked(updateDoc).mockResolvedValue();
});
afterEach(() => vi.unstubAllGlobals());

it("names an edit dialog by its title and keeps a separate close control", async () => {
  const user = userEvent.setup();
  const close = vi.fn();
  render(
    <FormDialog open title="Modifier le cercle" onClose={close}>
      <input aria-label="Nom" />
    </FormDialog>,
  );
  expect(
    screen.getByRole("dialog", { name: "Modifier le cercle" }),
  ).toBeVisible();
  await user.click(
    screen.getByRole("button", { name: "Fermer le formulaire" }),
  );
  expect(close).toHaveBeenCalledOnce();
});

it("mounts sections on demand and retains drafts when switching away and back", async () => {
  const user = userEvent.setup();
  const mount = vi.fn();
  function OtherSection() {
    mount();
    return <p>Second section</p>;
  }
  render(
    <AccountTabs
      sections={[
        {
          id: "profiles",
          label: "Comitards",
          content: <input aria-label="Draft name" />,
        },
        { id: "bids", label: "Enchères", content: <OtherSection /> },
      ]}
    />,
  );
  expect(mount).not.toHaveBeenCalled();
  await user.type(screen.getByRole("textbox", { name: "Draft name" }), "Alice");
  await user.click(screen.getByRole("tab", { name: "Enchères" }));
  expect(screen.getByText("Second section")).toBeVisible();
  await user.click(screen.getByRole("tab", { name: "Comitards" }));
  expect(screen.getByRole("textbox", { name: "Draft name" })).toHaveValue(
    "Alice",
  );
});

it("searches all records across pages, without accents, and resets pagination", async () => {
  const user = userEvent.setup();
  const rows = Array.from({ length: 12 }, (_, id) => ({
    id,
    name: id === 11 ? "Élodie" : `Member ${id}`,
  }));
  render(
    <MobileRecordList
      rows={rows}
      label="les comitards"
      getKey={(row) => row.id}
      getSearchText={(row) => row.name}
      renderItem={(row) => <RecordCard title={row.name} />}
    />,
  );
  expect(screen.getAllByRole("article")).toHaveLength(10);
  await user.click(screen.getByRole("button", { name: "Suivant" }));
  expect(screen.getAllByRole("article")).toHaveLength(2);
  await user.type(
    screen.getByRole("textbox", { name: "Rechercher les comitards" }),
    "elodie",
  );
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(screen.getByRole("article", { name: "Élodie" })).toBeVisible();
  await user.click(
    screen.getByRole("button", { name: "Effacer la recherche" }),
  );
  expect(screen.getAllByRole("article")).toHaveLength(10);
});

const profile = {
  firstname: "Alice",
  name: "Demo",
  nickname: "AD",
  post: "Membre",
};
const data = {
  id: "edition",
  data: () => ({
    cercles: {
      first: { name: "Same circle name", comitards: { shared: profile } },
      second: {
        name: "Same circle name",
        comitards: { shared: { ...profile, firstname: "Bob" } },
      },
    },
  }),
};

it("opens the correct profile and confirms the correct targeted deletion on mobile", async () => {
  const user = userEvent.setup();
  const edit = vi.fn();
  const refresh = vi.fn();
  render(
    <ComitardTable
      data={data}
      admin
      refetchData={refresh}
      handleOpenModalComitard={edit}
    />,
  );
  const bob = screen.getByRole("article", { name: "Bob Demo" });
  await user.click(within(bob).getByRole("button", { name: "Modifier" }));
  expect(edit).toHaveBeenCalledWith(
    expect.objectContaining({ id: "shared", cercleId: "second" }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Actions pour Bob Demo" }),
  );
  await user.click(
    screen.getByRole("menuitem", { name: "Supprimer le comitard" }),
  );
  expect(updateDoc).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Annuler" }));
  expect(updateDoc).not.toHaveBeenCalled();
  await user.click(
    await screen.findByRole("button", { name: "Actions pour Bob Demo" }),
  );
  await user.click(
    screen.getByRole("menuitem", { name: "Supprimer le comitard" }),
  );
  await user.click(screen.getByRole("button", { name: "Procéder" }));
  expect(updateDoc).toHaveBeenCalledWith("edition-reference", {
    "cercles.second.comitards.shared": "DELETE",
  });
  expect(refresh).toHaveBeenCalledOnce();
  await user.click(screen.getByRole("button", { name: "Fermer" }));
  await user.click(
    await screen.findByRole("button", { name: "Actions pour Alice Demo" }),
  );
  await user.click(
    screen.getByRole("menuitem", { name: "Supprimer le comitard" }),
  );
  expect(screen.getByRole("button", { name: "Procéder" })).toBeEnabled();
});

it("only exposes a member’s own profiles and no deletion controls", () => {
  render(
    <ComitardTable
      data={data}
      admin={false}
      refetchData={vi.fn()}
      handleOpenModalComitard={vi.fn()}
    />,
  );
  expect(screen.getByRole("article", { name: "Alice Demo" })).toBeVisible();
  expect(
    screen.queryByRole("article", { name: "Bob Demo" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Actions pour/ }),
  ).not.toBeInTheDocument();
});
