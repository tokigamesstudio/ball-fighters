import { describe, it, expect, beforeEach } from 'vitest';
import { createMockWallet } from '../../server/ports/wallet.js';

describe('Wallet Port', () => {
  let wallet;

  beforeEach(() => {
    wallet = createMockWallet();
  });

  it('debit returns success and balance', async () => {
    const result = await wallet.debit('player1', 100, 'tx-001');
    
    expect(result.success).toBe(true);
    expect(result).toHaveProperty('balance');
    expect(result.balance).toBe(-100);
  });

  it('credit returns success and balance', async () => {
    const result = await wallet.credit('player1', 50, 'tx-002');
    
    expect(result.success).toBe(true);
    expect(result).toHaveProperty('balance');
    expect(result.balance).toBe(50);
  });

  it('duplicate txRef on debit is idempotent', async () => {
    const result1 = await wallet.debit('player1', 100, 'tx-003');
    const result2 = await wallet.debit('player1', 100, 'tx-003');
    
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.balance).toBe(result2.balance);
    expect(result2.balance).toBe(-100); // Not -200
  });

  it('duplicate txRef on credit is idempotent', async () => {
    const result1 = await wallet.credit('player1', 75, 'tx-004');
    const result2 = await wallet.credit('player1', 75, 'tx-004');
    
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.balance).toBe(result2.balance);
    expect(result2.balance).toBe(75); // Not 150
  });
});
