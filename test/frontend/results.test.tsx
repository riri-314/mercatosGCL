import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatTimeLeft, useComitardResults } from '../../src/sections/results/results-helper';

const now = 1_800_000_000_000;
const timestamp = (ms: number) => ({ toMillis: () => ms });
const snapshot = (cercles: unknown) => ({ data: () => ({ cercles }) });
const profile = (nickname: string, stop: number) => ({ nickname, enchereStop: timestamp(stop) });

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(now);
});

describe('auction results', () => {
  it.each([null, undefined, snapshot(undefined), snapshot(null), snapshot([])])(
    'returns empty results when no edition data is available', (doc) => {
      const { result } = renderHook(() => useComitardResults(doc));
      expect(result.current).toEqual({ running: [], closed: [] });
    },
  );

  it('sorts running auctions by earliest finish and closed auctions by latest finish', () => {
    const doc = snapshot({ seller: { name: 'Seller', comitards: {
      later: profile('Later', now + 20_000), first: profile('First', now + 1000),
      old: profile('Old', now - 20_000), recent: profile('Recent', now - 1000),
      unstarted: { nickname: 'Unstarted' },
    } } });
    const { result } = renderHook(() => useComitardResults(doc));
    expect(result.current.running.map((item) => item.nickname)).toEqual(['First', 'Later']);
    expect(result.current.closed.map((item) => item.nickname)).toEqual(['Recent', 'Old']);
    expect(result.current.running[0].cercle).toBe('Seller');
  });

  it('considers an auction closed exactly at its stop time', () => {
    const { result } = renderHook(() => useComitardResults(snapshot({
      seller: { comitards: { target: profile('Target', now) } },
    })));
    expect(result.current.running).toEqual([]);
    expect(result.current.closed).toHaveLength(1);
  });

  it('maps bid sender IDs to circle names and sorts bid history chronologically', () => {
    const encheres = {
      last: { sender: 'buyer', vote: 15, date: timestamp(2000) },
      first: { sender: 'unknown', date: timestamp(1000) },
    };
    const doc = snapshot({
      seller: { name: 'Seller', comitards: { target: { ...profile('Target', now + 1000), encheres } } },
      buyer: { name: 'Buyer' },
    });
    const { result } = renderHook(() => useComitardResults(doc));
    expect(result.current.running[0].encheres).toEqual([
      { sender: '', vote: 0, date: encheres.first.date },
      { sender: 'Buyer', vote: 15, date: encheres.last.date },
    ]);
    expect(Object.keys(encheres)).toEqual(['last', 'first']);
  });

  it('accepts legacy bid arrays without mutating their order', () => {
    const encheres = [
      { sender: 'Buyer', vote: 20, date: timestamp(2000) },
      { sender: 'Other', vote: 10, date: timestamp(1000) },
    ];
    const doc = snapshot({ seller: { comitards: { target: { ...profile('Target', now + 1000), encheres } } } });
    const { result } = renderHook(() => useComitardResults(doc));
    expect(result.current.running[0].encheres.map((bid) => bid.vote)).toEqual([10, 20]);
    expect(encheres.map((bid) => bid.vote)).toEqual([20, 10]);
  });

  it('recomputes results when a new Firestore snapshot arrives', () => {
    const { result, rerender } = renderHook((doc) => useComitardResults(doc), {
      initialProps: snapshot({ seller: { comitards: { target: profile('Target', now + 1000) } } }),
    });
    expect(result.current.running).toHaveLength(1);
    rerender(snapshot({ seller: { comitards: { target: profile('Target', now - 1000) } } }));
    expect(result.current.running).toHaveLength(0);
    expect(result.current.closed).toHaveLength(1);
  });

  it.each([[0, '0s'], [59_999, '59s'], [61_000, '1m 1s'], [3_661_000, '1h 1m']])(
    'formats %s milliseconds as %s', (ms, expected) => expect(formatTimeLeft(ms)).toBe(expected),
  );
});
