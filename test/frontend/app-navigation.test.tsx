import { useEffect, useState, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
import App from "../../src/App";

const session = vi.hoisted(() => ({ user: null as User | null, mounted: vi.fn() }));
vi.mock("../../src/auth/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../../src/auth/auth-context", () => ({
  useAuth: () => ({ user: session.user, loading: false }),
}));
vi.mock("../../src/theme", () => ({ default: ({ children }: { children: ReactNode }) => children }));
vi.mock("../../src/auth/cercle-session-banner", () => ({ default: () => null }));
vi.mock("../../src/data/DataProvider", () => ({ DataProvider: ({ children }: { children: ReactNode }) => {
  const [value, setValue] = useState(0);
  useEffect(() => { session.mounted(); }, []);
  return <><button onClick={() => setValue(value + 1)}>Saved state: {value}</button>{children}</>;
} }));
vi.mock("../../src/routes/sections", () => ({ default: () => <Link to="/comitards">Comitards</Link> }));

beforeEach(() => {
  session.user = null;
  session.mounted.mockClear();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

it("preserves edition data and local state across page navigation", async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><App /></MemoryRouter>);
  await user.click(screen.getByRole("button", { name: "Saved state: 0" }));
  await user.click(screen.getByRole("link", { name: "Comitards" }));
  expect(session.mounted).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Saved state: 1" })).toBeInTheDocument();
});

it("resets edition data when the authenticated account changes", async () => {
  const user = userEvent.setup();
  const app = <MemoryRouter><App /></MemoryRouter>;
  const { rerender } = render(app);
  await user.click(screen.getByRole("button", { name: "Saved state: 0" }));
  session.user = { uid: "buyer" } as User;
  rerender(<MemoryRouter><App /></MemoryRouter>);
  expect(session.mounted).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("button", { name: "Saved state: 0" })).toBeInTheDocument();
});
