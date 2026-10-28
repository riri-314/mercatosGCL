import { act, renderHook, waitFor } from '@testing-library/react';
import { getDocs, limit, onSnapshot, orderBy, where } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../src/auth/auth-context';
import { DataProvider } from '../../src/data/DataProvider';
import { useData } from '../../src/data/data-context';

vi.mock('../../src/auth/auth-context', () => ({ useAuth: vi.fn() }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(), query: vi.fn(), where: vi.fn(), orderBy: vi.fn(), limit: vi.fn(),
  getDocs: vi.fn(), onSnapshot: vi.fn(),
}));

const unsubscribe = vi.fn();
const edition = { id: 'latest-edition', data: () => ({ edition: 2 }) };
const populated = { empty: false, docs: [edition] };
let emitSnapshot: (snapshot: typeof populated) => void;

function setUser(uid: string | null) {
  vi.mocked(useAuth).mockReturnValue({
    user: uid ? { uid } as NonNullable<ReturnType<typeof useAuth>['user']> : null,
    isAdmin: () => false, loading: false,
  });
}

beforeEach(() => {
  setUser(null);
  vi.mocked(getDocs).mockReset();
  vi.mocked(getDocs).mockResolvedValue(populated as unknown as Awaited<ReturnType<typeof getDocs>>);
  vi.mocked(onSnapshot).mockImplementation((...args: unknown[]) => {
    emitSnapshot = args[1] as typeof emitSnapshot;
    return unsubscribe;
  });
});

describe('edition data', () => {
  it('loads only the latest active edition for visitors and records fetch time', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
    const { result } = renderHook(() => useData(), { wrapper: DataProvider });
    await waitFor(() => expect(result.current.data).toBe(edition));
    expect(where).toHaveBeenCalledWith('active', '==', true);
    expect(orderBy).toHaveBeenCalledWith('edition', 'desc');
    expect(limit).toHaveBeenCalledWith(1);
    expect(result.current.fetchedTime).toBe(1_800_000_000_000);
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it('lets visitors manually refresh edition data', async () => {
    const { result } = renderHook(() => useData(), { wrapper: DataProvider });
    await waitFor(() => expect(result.current.data).toBe(edition));
    const updated = { id: 'new-edition', data: () => ({ edition: 3 }) };
    vi.mocked(getDocs).mockResolvedValue({ empty: false, docs: [updated] } as unknown as Awaited<ReturnType<typeof getDocs>>);
    await act(async () => result.current.refetchData());
    expect(result.current.data).toBe(updated);
    expect(getDocs).toHaveBeenCalledTimes(2);
  });

  it('leaves data empty when no active edition exists', async () => {
    vi.mocked(getDocs).mockResolvedValue({ empty: true, docs: [] } as unknown as Awaited<ReturnType<typeof getDocs>>);
    const { result } = renderHook(() => useData(), { wrapper: DataProvider });
    await act(async () => {});
    expect(result.current).toMatchObject({ data: null, fetchedTime: 0 });
  });

  it('handles a failed visitor fetch without an unhandled rejection', async () => {
    const error = new Error('offline');
    vi.mocked(getDocs).mockRejectedValue(error);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useData(), { wrapper: DataProvider });
    await waitFor(() => expect(log).toHaveBeenCalledWith('Error fetching data:', error));
    expect(result.current.data).toBeNull();
  });

  it('streams updates for authenticated members without starting manual fetches', async () => {
    setUser('member');
    const { result } = renderHook(() => useData(), { wrapper: DataProvider });
    await act(async () => emitSnapshot(populated));
    expect(result.current.data).toBe(edition);
    const updated = { id: 'latest-edition', data: () => ({ edition: 2, jobs: 1 }) };
    await act(async () => emitSnapshot({ empty: false, docs: [updated] }));
    expect(result.current.data).toBe(updated);
    act(() => result.current.refetchData());
    expect(getDocs).not.toHaveBeenCalled();
    expect(onSnapshot).toHaveBeenCalledOnce();
  });

  it('removes the snapshot listener on unmount', async () => {
    setUser('member');
    const { unmount } = renderHook(() => useData(), { wrapper: DataProvider });
    await act(async () => {});
    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('switches from streaming to public fetches after sign-out', async () => {
    setUser('member');
    const { rerender } = renderHook(() => useData(), { wrapper: DataProvider });
    await act(async () => {});
    setUser(null);
    rerender();
    await waitFor(() => expect(getDocs).toHaveBeenCalledOnce());
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
