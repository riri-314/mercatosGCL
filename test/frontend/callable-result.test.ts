import { describe, expect, it } from 'vitest';
import { requireMutationSuccess } from '../../src/utils/callable-result';

describe('mutation acknowledgements', () => {
  it('accepts an explicit success acknowledgement', () => {
    expect(() => requireMutationSuccess({ success: true })).not.toThrow();
  });

  it('shows the server message when a mutation was rejected', () => {
    expect(() => requireMutationSuccess({ success: false, message: 'Balance insuffisante' }))
      .toThrow('Balance insuffisante');
  });

  it.each([undefined, null, false, 'success', {}, [], { success: 1 },
    { success: 'true' }, { success: false, message: 42 }])(
    'rejects an unconfirmed response: %j', (response) => {
      expect(() => requireMutationSuccess(response))
        .toThrow("L'opération n'a pas été confirmée. Veuillez réessayer.");
    },
  );
});
