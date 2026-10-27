import { beforeEach, describe, expect, it, vi } from 'vitest';
import { writeBatch } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { deleteEnchereWithStates, editEnchereAmount, setActiveEdition } from '../../src/utils/admin-tools';
import { getDocs } from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(), doc: vi.fn(() => 'edition-reference'), query: vi.fn(), where: vi.fn(),
  getDocs: vi.fn(), updateDoc: vi.fn(), deleteField: vi.fn(() => 'DELETE_FIELD'),
  increment: vi.fn((amount: number) => ({ increment: amount })),
  writeBatch: vi.fn(), runTransaction: vi.fn(),
}));
vi.mock('firebase/functions', () => ({ httpsCallable: vi.fn() }));
vi.mock('firebase/auth', () => ({ sendPasswordResetEmail: vi.fn() }));

function editionData() {
  return { cercles: {
    buyer: { nbFut: 20, comitards: {} },
    seller: { comitards: { target: {
      enchereStart: 1, enchereStop: 2, enchereProcessed: false,
      encheres: { bid: { sender: 'buyer', vote: 10 } },
    } } },
  } };
}

const original = (data: unknown) => ({ id: 'edition', data: () => data });
const correction = Object.assign(vi.fn(), { stream: vi.fn() });

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  correction.mockReset().mockResolvedValue({ data: { success: true } });
  vi.mocked(httpsCallable).mockReturnValue(correction);
});

describe('admin bid corrections', () => {
  it('sends the expected bid amount and refund choice to the backend', async () => {
    expect(await deleteEnchereWithStates(original(editionData()), 'bid', true)).toMatchObject({ status: 'ok' });
    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'deletebid');
    expect(correction).toHaveBeenCalledWith({ editionId: 'edition', bidId: 'bid', expectedAmount: 10, refund: true });
  });

  it('lets the backend compute balance adjustments when editing a bid', async () => {
    expect(await editEnchereAmount(true, original(editionData()), 'bid', 15)).toBe(0);
    expect(correction).toHaveBeenCalledWith({ editionId: 'edition', bidId: 'bid', expectedAmount: 10, amount: 15, refund: true });
  });

  it('rejects missing source data and unknown bids without calling the backend', async () => {
    expect(await deleteEnchereWithStates(original(undefined), 'bid', true)).toMatchObject({ status: 'error' });
    expect(await deleteEnchereWithStates(original(editionData()), 'unknown', true)).toMatchObject({ status: 'error' });
    expect(correction).not.toHaveBeenCalled();
  });

  it('reports stale amounts from the backend', async () => {
    correction.mockRejectedValue({ code: 'functions/aborted' });
    expect(await deleteEnchereWithStates(original(editionData()), 'bid', true)).toMatchObject({ status: 'stale_client' });
  });

  it('requires a confirmed successful response', async () => {
    correction.mockResolvedValue({ data: {} });
    expect(await deleteEnchereWithStates(original(editionData()), 'bid', true)).toMatchObject({ status: 'error' });
    await expect(editEnchereAmount(true, original(editionData()), 'bid', 15)).rejects.toThrow();
  });

  it('reports rejected corrections without claiming success', async () => {
    correction.mockRejectedValue(new Error('Settled auction'));
    expect(await deleteEnchereWithStates(original(editionData()), 'bid', false)).toMatchObject({ status: 'error', message: 'Settled auction' });
  });
});

describe('edition activation', () => {
  const batch = { update: vi.fn(), commit: vi.fn() };
  const lock = Object.assign(vi.fn(), { stream: vi.fn() });
  const unlock = Object.assign(vi.fn(), { stream: vi.fn() });

  beforeEach(() => {
    batch.commit.mockReset().mockResolvedValue(undefined);
    lock.mockReset().mockResolvedValue({ data: {} });
    unlock.mockReset().mockResolvedValue({ data: {} });
    vi.mocked(writeBatch).mockReturnValue(batch as unknown as ReturnType<typeof writeBatch>);
    vi.mocked(httpsCallable).mockImplementation((_functions, name) => name === 'unlockeditionpictures' ? unlock : lock);
    const documents = [
      { id: 'target', ref: 'target-ref', data: () => ({ edition: 3, active: false }) },
      { id: 'current', ref: 'current-ref', data: () => ({ edition: 2, active: true }) },
      { id: 'archive', ref: 'archive-ref', data: () => ({ edition: 1, active: false }) },
    ];
    vi.mocked(getDocs).mockResolvedValue({ forEach: (callback: (doc: unknown) => void) => documents.forEach(callback) } as unknown as Awaited<ReturnType<typeof getDocs>>);
  });

  it('switches the active edition atomically and toggles only affected picture locks', async () => {
    expect(await setActiveEdition(3)).toBe(1);
    expect(batch.update.mock.calls).toEqual([
      ['target-ref', { active: true }], ['current-ref', { active: false }], ['archive-ref', { active: false }],
    ]);
    expect(batch.commit).toHaveBeenCalledOnce();
    expect(unlock).toHaveBeenCalledWith({ editionId: 'target' });
    expect(lock).toHaveBeenCalledExactlyOnceWith({ editionId: 'current' });
    expect(batch.commit.mock.invocationCallOrder[0]).toBeLessThan(unlock.mock.invocationCallOrder[0]);
  });

  it('does not commit changes or toggle pictures if the requested edition is missing', async () => {
    expect(await setActiveEdition(99)).toBe(0);
    expect(batch.commit).not.toHaveBeenCalled();
    expect(unlock).not.toHaveBeenCalled();
    expect(lock).not.toHaveBeenCalled();
  });

  it('does not toggle picture access when the database commit fails', async () => {
    batch.commit.mockRejectedValue(new Error('offline'));
    await expect(setActiveEdition(3)).rejects.toThrow('offline');
    expect(unlock).not.toHaveBeenCalled();
    expect(lock).not.toHaveBeenCalled();
  });
});
