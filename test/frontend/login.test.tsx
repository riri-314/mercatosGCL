import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import LoginView from "../../src/sections/login/login-view";
import { auth } from "../../src/firebase_config";

vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

// Iconify can fetch icon definitions; the icon image is irrelevant to login.
vi.mock("../../src/components/iconify/iconify", () => ({
  default: () => null,
}));

function renderLogin() {
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/" element={<h1>Results page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

async function enterCredentials(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Email"), "member@example.test");
  await user.type(screen.getByLabelText("Mot de passe"), "example-password");
}

beforeEach(() => {
  vi.mocked(signInWithEmailAndPassword).mockReset();
  vi.mocked(sendPasswordResetEmail).mockReset();
});

describe("login", () => {
  it("submits from the keyboard", async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue(
      {} as Awaited<ReturnType<typeof signInWithEmailAndPassword>>,
    );
    const user = renderLogin();
    await enterCredentials(user);
    await user.keyboard("{Enter}");
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      "member@example.test",
      "example-password",
    );
    expect(await screen.findByText("Results page")).toBeInTheDocument();
  });

  it.each(["none", "email only", "password only"])(
    "requires both credentials (%s)",
    async (fields) => {
      const user = renderLogin();
      if (fields === "email only")
        await user.type(screen.getByLabelText("Email"), "member@example.test");
      if (fields === "password only")
        await user.type(screen.getByLabelText("Mot de passe"), "password");
      await user.click(screen.getByRole("button", { name: "Connexion" }));
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Entrez un mot de passe ou une adresse mail",
      );
      expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    },
  );

  it("waits for authentication before navigating to results", async () => {
    let finish!: () => void;
    vi.mocked(signInWithEmailAndPassword).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () =>
            resolve(
              {} as Awaited<ReturnType<typeof signInWithEmailAndPassword>>,
            );
        }),
    );
    const user = renderLogin();
    await enterCredentials(user);
    await user.click(screen.getByRole("button", { name: "Connexion" }));
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      "member@example.test",
      "example-password",
    );
    expect(screen.getByRole("button", { name: /Connexion/ })).toBeDisabled();
    expect(screen.queryByText("Results page")).not.toBeInTheDocument();
    await act(async () => finish());
    expect(await screen.findByText("Results page")).toBeInTheDocument();
  });

  it("keeps the login form usable after authentication fails", async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue(
      new Error("invalid credential"),
    );
    const user = renderLogin();
    await enterCredentials(user);
    await user.click(screen.getByRole("button", { name: "Connexion" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Erreur de connection",
    );
    expect(screen.getByRole("button", { name: "Connexion" })).toBeEnabled();
    expect(screen.queryByText("Results page")).not.toBeInTheDocument();
  });

  it("toggles password visibility without changing the entered password", async () => {
    const user = renderLogin();
    const password = screen.getByLabelText("Mot de passe");
    await user.type(password, "example-password");
    expect(password).toHaveAttribute("type", "password");
    await user.click(
      screen.getByRole("button", { name: "Afficher le mot de passe" }),
    );
    expect(password).toHaveAttribute("type", "text");
    expect(password).toHaveValue("example-password");
    await user.click(
      screen.getByRole("button", { name: "Masquer le mot de passe" }),
    );
    expect(password).toHaveAttribute("type", "password");
  });
});

describe("password recovery", () => {
  it("requires an email before requesting a reset", async () => {
    const user = renderLogin();
    await user.click(screen.getByText("Mot de passe oublié?"));
    await user.click(
      screen.getByRole("button", { name: "Réinitialiser le mot de passe" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Entrez une adresse mail pour changer votre mot de passe",
    );
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("sends the reset email and lets the user return to login", async () => {
    vi.mocked(sendPasswordResetEmail).mockResolvedValue();
    const user = renderLogin();
    await user.click(screen.getByText("Mot de passe oublié?"));
    await user.type(screen.getByLabelText("Email"), "member@example.test");
    await user.click(
      screen.getByRole("button", { name: "Réinitialiser le mot de passe" }),
    );
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      auth,
      "member@example.test",
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Un email vous a été envoyé",
    );
    await user.click(screen.getByText("Connecte-toi", { selector: "a" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connexion" })).toBeEnabled();
  });

  it("shows reset failures and releases the loading state", async () => {
    vi.mocked(sendPasswordResetEmail).mockRejectedValue(
      new Error("network failure"),
    );
    vi.spyOn(console, "log").mockImplementation(() => {});
    const user = renderLogin();
    await user.click(screen.getByText("Mot de passe oublié?"));
    await user.type(screen.getByLabelText("Email"), "member@example.test");
    await user.click(
      screen.getByRole("button", { name: "Réinitialiser le mot de passe" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Erreur de connection",
      ),
    );
    expect(
      screen.getByRole("button", { name: "Réinitialiser le mot de passe" }),
    ).toBeEnabled();
  });
});
