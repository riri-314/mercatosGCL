import { act, renderHook, waitFor } from '@testing-library/react';
import { onIdTokenChanged, signOut } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';
import type { IdTokenResult, User } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../src/auth/AuthProvider';
import { useAuth } from '../../src/auth/auth-context';

vi.mock('firebase/auth', () => ({ onIdTokenChanged: vi.fn(), signOut: vi.fn() }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(), doc: vi.fn(), getDoc: vi.fn(),
}));

let changeUser: (user: User | null) => Promise<void>;
const unsubscribe = vi.fn();

function firebaseUser(uid: string, claims = {}, email = `${uid}@example.test`) {
  return { uid, email, getIdTokenResult: vi.fn().mockResolvedValue({ claims }) } as unknown as User;
}

beforeEach(() => {
  vi.mocked(signOut).mockResolvedValue();
  vi.mocked(onIdTokenChanged).mockImplementation((_auth, callback) => {
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
    await act(async () => changeUser(firebaseUser('admin')));
    await waitFor(() => expect(result.current.isAdmin()).toBe(true));
    await act(async () => changeUser(null));
    expect(result.current.user).toBeNull();
    expect(result.current.isAdmin()).toBe(false);
  });

  it('does not grant admin access based on email alone', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await act(async () => changeUser(firebaseUser('member', {}, 'admin@example.test')));
    expect(result.current.user?.uid).toBe('member');
    expect(result.current.isAdmin()).toBe(false);
  });

  it.each([false, true])('handles a missing admin map (document exists: %s)', async (exists) => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => exists, data: () => ({}) } as Awaited<ReturnType<typeof getDoc>>);
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await act(async () => changeUser(firebaseUser('admin')));
    expect(result.current.loading).toBe(false);
    expect(result.current.isAdmin()).toBe(false);
  });

  it('removes the authentication listener when unmounted', async () => {
    const { unmount } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await act(async () => {});
    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('replaces the admin identity with the cercle identity and token-backed banner state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await act(async () => changeUser(firebaseUser('admin')));
    expect(result.current.isAdmin()).toBe(true);
    await act(async () => changeUser(firebaseUser('buyer', {
      cercleSession: true, cercleSessionName: 'Cercle Beta',
    })));
    expect(result.current.user?.uid).toBe('buyer');
    expect(result.current.cercleSession).toEqual({ name: 'Cercle Beta' });
    expect(result.current.isAdmin()).toBe(false);
    await act(async () => changeUser(null));
    expect(result.current.user).toBeNull();
    expect(result.current.cercleSession).toBeNull();
  });

  it('reads restored sessions and refreshed tokens instead of relying on browser flags', async () => {
    localStorage.setItem('cercleSession', 'true');
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await act(async () => changeUser(firebaseUser('buyer', {
      cercleSession: true, cercleSessionName: 'Cercle Beta',
    })));
    expect(result.current.cercleSession?.name).toBe('Cercle Beta');
    await act(async () => changeUser(firebaseUser('buyer')));
    expect(result.current.cercleSession).toBeNull();
    localStorage.clear();
  });

  it('does not let a slow token read restore a signed-out identity', async () => {
    let finish!: (value: IdTokenResult) => void;
    const user = firebaseUser('buyer');
    vi.mocked(user.getIdTokenResult).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    let pending!: Promise<void>;
    act(() => { pending = changeUser(user); });
    await act(async () => changeUser(null));
    await act(async () => {
      finish({ claims: { cercleSession: true, cercleSessionName: 'Old circle' } } as unknown as IdTokenResult);
      await pending;
    });
    expect(result.current).toMatchObject({ user: null, cercleSession: null, loading: false });
  });

  it('signs out when session claims cannot be verified', async () => {
    const user = firebaseUser('buyer');
    vi.mocked(user.getIdTokenResult).mockRejectedValue(new Error('unavailable'));
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await act(async () => changeUser(user));
    expect(signOut).toHaveBeenCalledOnce();
    expect(result.current).toMatchObject({ user: null, cercleSession: null, loading: false });
  });
});
