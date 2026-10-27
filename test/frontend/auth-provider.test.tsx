import { act, renderHook, waitFor } from '@testing-library/react';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../../src/auth/AuthProvider';

vi.mock('firebase/auth', () => ({ onAuthStateChanged: vi.fn() }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(), doc: vi.fn(), getDoc: vi.fn(),
}));

let changeUser: (user: User | null) => void;
const unsubscribe = vi.fn();

beforeEach(() => {
  vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
    changeUser = callback as typeof changeUser;
    return unsubscribe;
  });
  vi.mocked(getDoc).mockResolvedValue({
    exists: () => true,
    data: () => ({ admins: { 'admin@example.test': 'admin' } }),
  } as Awaited<ReturnType<typeof getDoc>>);
});

describe('authentication context', () => {
  it('stays loading until Firebase reports the initial auth state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current).toMatchObject({ user: null, loading: true });
    await act(async () => changeUser(null));
    expect(result.current).toMatchObject({ user: null, loading: false });
    expect(result.current.isAdmin()).toBe(false);
  });

  it('recognizes an admin by UID and clears the role on sign-out', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await act(async () => changeUser({ uid: 'admin' } as User));
    await waitFor(() => expect(result.current.isAdmin()).toBe(true));
    await act(async () => changeUser(null));
    expect(result.current.user).toBeNull();
    expect(result.current.isAdmin()).toBe(false);
  });

  it('does not grant admin access based on email alone', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await act(async () => changeUser({ uid: 'member', email: 'admin@example.test' } as User));
    expect(result.current.user?.uid).toBe('member');
    expect(result.current.isAdmin()).toBe(false);
  });

  it.each([false, true])('handles a missing admin map (document exists: %s)', async (exists) => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => exists, data: () => ({}) } as Awaited<ReturnType<typeof getDoc>>);
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await act(async () => changeUser({ uid: 'admin' } as User));
    expect(result.current.loading).toBe(false);
    expect(result.current.isAdmin()).toBe(false);
  });

  it('removes the authentication listener when unmounted', async () => {
    const { unmount } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await act(async () => {});
    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
