import { act, renderHook, waitFor } from "@testing-library/react";
import { getDocs, limit, startAfter } from "firebase/firestore";
import { beforeEach, expect, it, vi } from "vitest";
import { EDITION_PAGE_SIZE, useEditionHistory } from "../../src/data/use-edition-history";

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "editions"), orderBy: vi.fn(), query: vi.fn(),
  limit: vi.fn(), startAfter: vi.fn(), getDocs: vi.fn(),
}));

const documents = Array.from({ length: EDITION_PAGE_SIZE + 1 }, (_, id) => ({ id: String(id), data: () => ({ edition: 100 - id }) }));
const result = (docs = documents) => ({ docs }) as unknown as Awaited<ReturnType<typeof getDocs>>;

beforeEach(() => vi.mocked(getDocs).mockReset().mockResolvedValue(result()));

it("reads one bounded page, uses the last visible document as cursor, and returns to page one", async () => {
  const { result: hook } = renderHook(useEditionHistory);
  await waitFor(() => expect(hook.current.loading).toBe(false));
  expect(limit).toHaveBeenCalledWith(EDITION_PAGE_SIZE + 1);
  expect(hook.current.rows).toEqual(documents.slice(0, EDITION_PAGE_SIZE));
  expect(hook.current.hasNext).toBe(true);
  vi.mocked(getDocs).mockResolvedValueOnce(result([documents[10]]));
  act(() => hook.current.next());
  await waitFor(() => expect(hook.current.loading).toBe(false));
  expect(startAfter).toHaveBeenLastCalledWith(documents[9]);
  expect(hook.current.rows).toEqual([documents[10]]);
  expect(hook.current.hasNext).toBe(false);
  act(() => hook.current.next());
  expect(hook.current.page).toBe(1);
  act(() => hook.current.previous());
  await waitFor(() => expect(hook.current.loading).toBe(false));
  expect(hook.current.page).toBe(0);
  expect(hook.current.rows).toHaveLength(EDITION_PAGE_SIZE);
});

it("keeps loaded rows after a failed refresh and allows retry", async () => {
  const { result: hook } = renderHook(useEditionHistory);
  await waitFor(() => expect(hook.current.loading).toBe(false));
  vi.mocked(getDocs).mockRejectedValueOnce(new Error("Unavailable"));
  await act(() => hook.current.refresh());
  expect(hook.current.error).toBe("Unavailable");
  expect(hook.current.rows).toHaveLength(EDITION_PAGE_SIZE);
  await act(() => hook.current.refresh());
  expect(hook.current.error).toBe("");
});

it("ignores an older response that arrives after a newer refresh", async () => {
  let resolve!: (value: Awaited<ReturnType<typeof getDocs>>) => void;
  vi.mocked(getDocs).mockReturnValueOnce(new Promise(done => { resolve = done; }));
  const { result: hook } = renderHook(useEditionHistory);
  await act(() => hook.current.refresh());
  await act(async () => resolve(result([])));
  expect(hook.current.rows).toHaveLength(EDITION_PAGE_SIZE);
});
