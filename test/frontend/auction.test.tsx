import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../../src/auth/AuthProvider';
import { functions } from "../../src/firebase_functions";
import { campusLabel, formatTimeLeft, useComitardAuction } from '../../src/sections/comitards/comitard-helper';
import type { UseComitardAuctionArgs } from '../../src/sections/comitards/comitard-helper';

vi.mock('firebase/functions', () => ({ httpsCallable: vi.fn() }));
vi.mock('../../src/auth/AuthProvider', () => ({ useAuth: vi.fn() }));

const now = 1_800_000_000_000;
const timestamp = (ms: number) => ({ toMillis: () => ms });
const submit = Object.assign(vi.fn(), { stream: vi.fn() });

function authState(uid: string | null = 'buyer', admin = false) {
  vi.mocked(useAuth).mockReturnValue({
    user: uid ? { uid } as NonNullable<ReturnType<typeof useAuth>['user']> : null,
    loading: false,
    isAdmin: () => admin,
  });
}

function args(overrides: Partial<UseComitardAuctionArgs> = {}): UseComitardAuctionArgs {
  return {
    product: {}, cercleId: 'seller', comitardId: 'target', editionId: 'edition',
    nbFutsLeft: 50, enchereMin: 5, enchereMax: 100, isInTimeFrame: true, now,
    refetchData: vi.fn(), ...overrides,
  };
}

function activeProduct() {
  return {
    enchereStart: timestamp(now - 1000), enchereStop: timestamp(now + 5000),
    encheres: {
      old: { vote: 10, sender: 'buyer', date: { seconds: 1 } },
      latest: { vote: 15, sender: 'other', date: { seconds: 2 } },
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  authState();
  submit.mockReset();
  vi.mocked(httpsCallable).mockReturnValue(submit);
});

describe('auction availability and limits', () => {
  it('opens and closes voting at time boundaries without a page clock', () => {
    const product = { enchereStart: timestamp(now + 1000), enchereStop: timestamp(now + 3000) };
    const { result } = renderHook(() => useComitardAuction(args({ product, now: undefined })));
    expect(result.current.displayVote).toBe(false);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.displayVote).toBe(true);
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.displayVote).toBe(false);
    expect(result.current.timeLeft).toBe(0);
  });
  it('allows members to start an auction within their balance', () => {
    const { result } = renderHook(() => useComitardAuction(args()));
    expect(result.current).toMatchObject({
      displayVote: true, isAuctionActive: false, timeLeft: 0, won: false,
      minEnchereComputed: 5, voteMax: 50, isDisabled: false,
    });
  });

  it.each([
    ['anonymous visitor', null, false, {}],
    ['own circle', 'seller', false, {}],
    ['administrator', 'buyer', true, {}],
    ['closed edition', 'buyer', false, { isInTimeFrame: false }],
    ['empty balance', 'buyer', false, { nbFutsLeft: 0 }],
    ['insufficient balance', 'buyer', false, { nbFutsLeft: 4 }],
  ] as const)('hides voting for %s', (_label, uid, admin, overrides) => {
    authState(uid, admin);
    const { result } = renderHook(() => useComitardAuction(args(overrides)));
    expect(result.current.displayVote).toBe(false);
  });

  it('uses the latest bid, highest amount, and remaining auction time', () => {
    const { result } = renderHook(() => useComitardAuction(args({ product: activeProduct() })));
    expect(result.current).toMatchObject({
      isAuctionActive: true, timeLeft: 5000, displayVote: true, won: false,
      firstEnchere: { vote: 15, sender: 'other' }, maxEnchere: 15, minEnchereComputed: 16,
    });
  });

  it('normalizes legacy numeric strings and filters malformed bids', () => {
    const product = { ...activeProduct(), encheres: {
      valid: { vote: '12', sender: 'other', date: { seconds: '2' } },
      invalid: { vote: 'bad', sender: 'other' }, missingSender: { vote: 20 }, empty: null,
    } };
    const { result } = renderHook(() => useComitardAuction(args({ product })));
    expect(result.current.encheresArray).toEqual([{ vote: 12, sender: 'other', date: { seconds: 2 } }]);
  });

  it('breaks same-second bid ties using the higher amount', () => {
    const product = activeProduct();
    product.encheres.old.date.seconds = 2;
    const { result } = renderHook(() => useComitardAuction(args({ product })));
    expect(result.current.firstEnchere?.vote).toBe(15);
  });

  it('disables counterbids once the configured maximum is reached', () => {
    const { result } = renderHook(() => useComitardAuction(args({ product: activeProduct(), enchereMax: 15 })));
    expect(result.current).toMatchObject({ isDisabled: true, voteMax: 15, minEnchereComputed: 15 });
  });

  it('closes voting and marks an expired auction as won', () => {
    const product = activeProduct();
    const { result, rerender } = renderHook((props) => useComitardAuction(props), {
      initialProps: args({ product }),
    });
    rerender(args({ product, now: now + 5001 }));
    expect(result.current).toMatchObject({ displayVote: false, isAuctionActive: false, timeLeft: 0, won: true });
  });
});

describe('bid submission', () => {
  it.each([0, -1, 4, 51, 101])('rejects invalid or unaffordable amount %s before calling Firebase', (vote) => {
    const { result } = renderHook(() => useComitardAuction(args()));
    act(() => result.current.setVote(vote));
    act(() => result.current.handleVote());
    expect(result.current).toMatchObject({ loading: false, voteErrorSeverity: 'error', voteError: 'Veuillez entrer une enchère valide' });
    expect(submit).not.toHaveBeenCalled();
  });

  it('waits for server confirmation, refreshes data, and clears the success message', async () => {
    let resolve!: (value: unknown) => void;
    submit.mockImplementation(() => new Promise((done) => { resolve = done; }));
    const props = args();
    const { result } = renderHook(() => useComitardAuction(props));
    act(() => result.current.setVote(10));
    act(() => result.current.handleVote());
    expect(result.current.loading).toBe(true);
    expect(httpsCallable).toHaveBeenCalledWith(functions, 'vote');
    expect(submit).toHaveBeenCalledWith({ vote: 10, editionId: 'edition', comitardId: 'target', clientTime: new Date(now).toISOString() });
    expect(props.refetchData).not.toHaveBeenCalled();
    await act(async () => resolve({ data: { success: true } }));
    expect(result.current).toMatchObject({ loading: false, voteErrorSeverity: 'success', voteError: 'Vote enregistré' });
    act(() => vi.advanceTimersByTime(2000));
    expect(props.refetchData).toHaveBeenCalledOnce();
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.voteError).toBe('');
  });

  it.each([
    ['rejected request', () => Promise.reject(new Error('Balance insuffisante')), 'Balance insuffisante'],
    ['unconfirmed response', () => Promise.resolve({ data: {} }), "L'opération n'a pas été confirmée. Veuillez réessayer."],
    ['server rejection', () => Promise.resolve({ data: { success: false, message: 'Enchère terminée' } }), 'Enchère terminée'],
  ])('shows a %s and refreshes without reporting success', async (_label, response, message) => {
    submit.mockImplementation(response);
    const props = args();
    const { result } = renderHook(() => useComitardAuction(props));
    act(() => result.current.setVote(10));
    await act(async () => result.current.handleVote());
    expect(result.current).toMatchObject({ loading: false, voteErrorSeverity: 'error', voteError: message });
    act(() => vi.advanceTimersByTime(2000));
    expect(props.refetchData).toHaveBeenCalledOnce();
  });

  it('resets the bid and error when switching profiles', () => {
    const { result, rerender } = renderHook((props) => useComitardAuction(props), { initialProps: args() });
    act(() => result.current.setVote(1));
    act(() => result.current.handleVote());
    rerender(args({ comitardId: 'another-profile' }));
    expect(result.current).toMatchObject({ vote: 0, voteError: '', loading: false, voteErrorSeverity: 'error' });
  });
});

describe('auction labels', () => {
  it.each([[0, '0s'], [59_999, '59s'], [61_000, '1m 1s'], [3_661_000, '1h 1m']])(
    'formats %s milliseconds as %s', (ms, expected) => expect(formatTimeLeft(ms)).toBe(expected),
  );

  it.each([[undefined, 'Non renseigné'], [0, 'Non renseigné'], [1, 'Possible 👌'],
    [2, 'Pas possible 👎'], [3, 'Bouillant mort! 🔥'], [4, 'Pas du tout possible 🙅'], [5, 'Non renseigné']])(
    'labels campus status %s', (campus, expected) => expect(campusLabel(campus)).toBe(expected),
  );
});
