import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runTransaction, writeBatch } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { deleteEnchereWithStates, setActiveEdition } from '../../src/utils/admin-tools';
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

const transaction = { get: vi.fn(), update: vi.fn() };
const original = (data: unknown) => ({ id: 'edition', data: () => data });

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  transaction.get.mockReset();
  vi.mocked(runTransaction).mockReset();
  vi.mocked(runTransaction).mockImplementation((_db, callback) => callback(transaction as unknown as Parameters<typeof callback>[0]));
});

describe('admin bid deletion', () => {
  it('atomically refunds the sender and resets an auction when its last bid is deleted', async () => {
    const data = editionData();
    transaction.get.mockResolvedValue({ exists: () => true, data: () => data });
    expect(await deleteEnchereWithStates(original(data), 'bid', true)).toMatchObject({ status: 'ok' });
    expect(transaction.update).toHaveBeenCalledOnce();
    expect(transaction.update).toHaveBeenCalledWith('edition-reference', {
      'cercles.seller.comitards.target.enchereProcessed': 'DELETE_FIELD',
      'cercles.seller.comitards.target.enchereStart': 'DELETE_FIELD',
      'cercles.seller.comitards.target.enchereStop': 'DELETE_FIELD',
      'cercles.seller.comitards.target.encheres': 'DELETE_FIELD',
      'cercles.buyer.nbFut': { increment: 10 },
    });
  });

  it('keeps other bids and auction timing when deleting one of several bids without a refund', async () => {
    const data = editionData();
    Object.assign(data.cercles.seller.comitards.target.encheres, { second: { sender: 'buyer', vote: 11 } });
    transaction.get.mockResolvedValue({ exists: () => true, data: () => data });
    expect(await deleteEnchereWithStates(original(data), 'bid', false)).toMatchObject({ status: 'ok' });
    expect(transaction.update).toHaveBeenCalledWith('edition-reference', {
      'cercles.seller.comitards.target.encheres.bid': 'DELETE_FIELD',
    });
  });

  it('refuses stale client data without deleting a bid or refunding funds', async () => {
    const data = editionData();
    const current = structuredClone(data);
    current.cercles.buyer.nbFut = 10;
    transaction.get.mockResolvedValue({ exists: () => true, data: () => current });
    expect(await deleteEnchereWithStates(original(data), 'bid', true)).toMatchObject({ status: 'stale_client' });
    expect(transaction.update).not.toHaveBeenCalled();
  });

  it('rejects missing original data before opening a transaction', async () => {
    expect(await deleteEnchereWithStates(original(undefined), 'bid', true)).toMatchObject({ status: 'error' });
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it('handles an edition that was deleted', async () => {
    transaction.get.mockResolvedValue({ exists: () => false });
    expect(await deleteEnchereWithStates(original(editionData()), 'bid', true)).toMatchObject({ status: 'error' });
    expect(transaction.update).not.toHaveBeenCalled();
  });

  it('does not refund an unknown bid', async () => {
    const data = editionData();
    transaction.get.mockResolvedValue({ exists: () => true, data: () => data });
    expect(await deleteEnchereWithStates(original(data), 'unknown', true)).toMatchObject({ status: 'error' });
    expect(transaction.update).not.toHaveBeenCalled();
  });

  it.each(['aborted', 'failed-precondition'])('reports a %s conflict as retryable', async (code) => {
    vi.mocked(runTransaction).mockRejectedValue({ code });
    expect(await deleteEnchereWithStates(original(editionData()), 'bid', true))
      .toMatchObject({ status: 'concurrent_write' });
  });

  it('reports unexpected transaction failures without claiming success', async () => {
    vi.mocked(runTransaction).mockRejectedValue(new Error('offline'));
    expect(await deleteEnchereWithStates(original(editionData()), 'bid', true)).toMatchObject({ status: 'error' });
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
