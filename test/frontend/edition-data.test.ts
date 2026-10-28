import { expect, it, vi } from "vitest";
import { getEditionData } from "../../src/data/edition-data";

it("decodes a shared snapshot once and invalidates when a new snapshot arrives", () => {
  const snapshot = { data: vi.fn(() => ({ cercles: { buyer: { nbFut: 10 } } })) };
  const first = getEditionData(snapshot);
  expect(getEditionData(snapshot)).toBe(first);
  expect(snapshot.data).toHaveBeenCalledOnce();

  const updated = { data: vi.fn(() => ({ cercles: { buyer: { nbFut: 5 } } })) };
  expect(getEditionData(updated)?.cercles.buyer.nbFut).toBe(5);
  expect(updated.data).toHaveBeenCalledOnce();
  expect(first?.cercles.buyer.nbFut).toBe(10);
});

it("handles missing snapshots and caches a missing document", () => {
  expect(getEditionData(null)).toBeUndefined();
  const snapshot = { data: vi.fn(() => undefined) };
  expect(getEditionData(snapshot)).toBeUndefined();
  expect(getEditionData(snapshot)).toBeUndefined();
  expect(snapshot.data).toHaveBeenCalledOnce();
});
