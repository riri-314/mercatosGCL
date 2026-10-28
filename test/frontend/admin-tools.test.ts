import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpsCallable } from 'firebase/functions';
import { deleteEnchereWithStates, editEnchereAmount, setActiveEdition } from '../../src/utils/admin-tools';

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
  localStorage.clear();
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
  it('uses the backend workflow and requires completed success', async () => {
    correction.mockResolvedValue({ data: { success: true, state: 'completed' } });
    expect(await setActiveEdition(3)).toBe(1);
    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'activateedition');
    expect(correction).toHaveBeenCalledWith({ edition: 3, operationId: expect.any(String) });
  });

  it('keeps the same operation ID when retrying a partial failure', async () => {
    correction.mockResolvedValueOnce({ data: { success: false, state: 'pending' } });
    await expect(setActiveEdition(3)).rejects.toThrow('reprise automatique');
    const first = correction.mock.calls[0][0];
    correction.mockResolvedValueOnce({ data: { success: true, state: 'completed' } });
    expect(await setActiveEdition(3)).toBe(1);
    expect(correction.mock.calls[1][0]).toEqual(first);
  });

  it('keeps the operation ID after a lost acknowledgement', async () => {
    correction.mockRejectedValueOnce(new Error('offline'));
    await expect(setActiveEdition(3)).rejects.toThrow('offline');
    correction.mockResolvedValueOnce({ data: { success: true, state: 'completed' } });
    await setActiveEdition(3);
    expect(correction.mock.calls[1][0]).toEqual(correction.mock.calls[0][0]);
  });
});
