import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { signInWithCustomToken, signOut } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { auth } from "../../src/firebase_config";
import { becomeCercle } from "../../src/auth/become-cercle";
import { AuthContext } from "../../src/auth/auth-context";
import CercleSessionBanner from "../../src/auth/cercle-session-banner";
import CercleTable from "../../src/sections/admin-account/cercle_table";

vi.mock("firebase/auth", () => ({
  onIdTokenChanged: vi.fn(), signInWithCustomToken: vi.fn(), signOut: vi.fn(),
}));
vi.mock("firebase/functions", () => ({ httpsCallable: vi.fn() }));

const switchAccount = Object.assign(vi.fn(), { stream: vi.fn() });
const status = Object.assign(vi.fn(), { stream: vi.fn() });

beforeEach(() => {
  Object.assign(auth, { currentUser: { uid: "admin" } });
  switchAccount.mockReset().mockResolvedValue({ data: { success: true, token: "circle-token" } });
  status.mockReset().mockResolvedValue({ data: { status: { buyer: false, disabled: true } } });
  vi.mocked(httpsCallable).mockImplementation(((_functions: unknown, name: string) => name === "getdisabledstatus" ? status : switchAccount) as typeof httpsCallable);
  vi.mocked(signInWithCustomToken).mockResolvedValue({} as Awaited<ReturnType<typeof signInWithCustomToken>>);
  vi.mocked(signOut).mockResolvedValue();
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    disconnect() {}
  });
});
afterEach(() => vi.unstubAllGlobals());

it("switches the existing Firebase login only after a confirmed token response", async () => {
  await becomeCercle("buyer", "edition");
  expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), "becomecercle");
  expect(switchAccount).toHaveBeenCalledWith({ uid: "buyer", editionId: "edition" });
  expect(signInWithCustomToken).toHaveBeenCalledWith(expect.anything(), "circle-token");
  expect(signOut).not.toHaveBeenCalled();
});

it.each([{ success: false }, { success: true }, { success: true, token: "" }])(
  "keeps the admin login when token preparation fails (%j)", async (data) => {
    switchAccount.mockResolvedValue({ data });
    await expect(becomeCercle("buyer", "edition")).rejects.toThrow();
    expect(signInWithCustomToken).not.toHaveBeenCalled();
  },
);

it("propagates a failed sign-in so the admin can retry", async () => {
  vi.mocked(signInWithCustomToken).mockRejectedValueOnce(new Error("Connexion indisponible"));
  await expect(becomeCercle("buyer", "edition")).rejects.toThrow("Connexion indisponible");
});

it("does not sign back in after the admin logs out during token preparation", async () => {
  switchAccount.mockImplementationOnce(async () => {
    Object.assign(auth, { currentUser: null });
    return { data: { success: true, token: "circle-token" } };
  });
  await expect(becomeCercle("buyer", "edition")).rejects.toThrow("Votre session a changé");
  expect(signInWithCustomToken).not.toHaveBeenCalled();
});

function renderBanner(active = true) {
  return render(<MemoryRouter initialEntries={["/account"]}>
    <AuthContext.Provider value={{ user: null, loading: false, isAdmin: () => false, cercleSession: active ? { name: "Cercle Beta" } : null }}>
      <CercleSessionBanner />
      <Routes>
        <Route path="/account" element={<p>Compte du cercle</p>} />
        <Route path="/login" element={<h1>Connexion</h1>} />
      </Routes>
    </AuthContext.Provider>
  </MemoryRouter>);
}

it("shows a persistent named warning and logs out to the normal login page", async () => {
  const user = userEvent.setup();
  const view = renderBanner();
  const banner = screen.getByRole("alert", { name: "Session cercle active" });
  expect(banner).toHaveTextContent("Vous êtes connecté en tant que Cercle Beta.");
  expect(banner).toHaveTextContent("Toutes vos actions sont effectuées avec ce compte cercle.");
  await user.click(within(banner).getByRole("button", { name: "Se déconnecter" }));
  expect(signOut).toHaveBeenCalledOnce();
  expect(await screen.findByRole("heading", { name: "Connexion" })).toBeInTheDocument();
  view.unmount();
  expect(document.documentElement.style.getPropertyValue("--cercle-session-banner-height")).toBe("");
});

it("keeps the warning and offers a retry after logout fails", async () => {
  vi.mocked(signOut).mockRejectedValueOnce(new Error("storage unavailable"));
  const user = userEvent.setup();
  renderBanner();
  await user.click(screen.getByRole("button", { name: "Se déconnecter" }));
  expect(await screen.findByText("La déconnexion a échoué. Réessayez.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Se déconnecter" })).toBeEnabled();
  expect(screen.queryByRole("heading", { name: "Connexion" })).not.toBeInTheDocument();
});

it("does not show the warning for ordinary logins", () => {
  renderBanner(false);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

const edition = { id: "edition", data: () => ({ cercles: {
  buyer: { name: "Cercle Beta", nbFut: 50, comitards: {} },
  disabled: { name: "Cercle Alpha", nbFut: 50, comitards: {} },
} }) };

function renderCircleTable(mobile = true) {
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches: mobile, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
  return render(<MemoryRouter initialEntries={["/admin"]}>
    <Routes>
      <Route path="/admin" element={<CercleTable data={edition} refetchData={vi.fn()} handleOpenModalCercle={vi.fn()} handleOpenModalMDP={vi.fn()} />} />
      <Route path="/account" element={<h1>Mon cercle</h1>} />
    </Routes>
  </MemoryRouter>);
}

it("offers the correct cercle switch and disables suspended accounts on mobile", async () => {
  const user = userEvent.setup();
  renderCircleTable();
  const button = screen.getByRole("button", { name: "Se connecter en tant que Cercle Beta" });
  await waitFor(() => expect(button).toBeEnabled());
  expect(screen.getByRole("button", { name: "Se connecter en tant que Cercle Alpha" })).toBeDisabled();
  await user.click(button);
  expect(switchAccount).toHaveBeenCalledWith({ uid: "buyer", editionId: "edition" });
  expect(await screen.findByRole("heading", { name: "Mon cercle" })).toBeInTheDocument();
});

it("shows switch failures in the cercle list without navigating away", async () => {
  switchAccount.mockRejectedValueOnce(new Error("Compte indisponible"));
  const user = userEvent.setup();
  renderCircleTable();
  const button = screen.getByRole("button", { name: "Se connecter en tant que Cercle Beta" });
  await waitFor(() => expect(button).toBeEnabled());
  await user.click(button);
  expect(await screen.findByRole("alert")).toHaveTextContent("Compte indisponible");
  expect(button).toBeEnabled();
  expect(screen.queryByRole("heading", { name: "Mon cercle" })).not.toBeInTheDocument();
});
