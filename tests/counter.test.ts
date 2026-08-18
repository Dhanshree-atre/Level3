/**
 * counter.test.ts
 * Level 3 — Midnight Counter dApp Tests
 *
 * Covers three required areas:
 *   a) Circuit logic       — does the circuit compute correctly?
 *   b) State transitions   — does ledger state update as expected?
 *   c) Privacy             — private input is never exposed in any output
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Mocked Midnight circuit environment
// In a real integration test these would call the compiled WASM circuits.
// Here we faithfully model the contract semantics from counter.compact.
// ─────────────────────────────────────────────────────────────────────────────

interface LedgerState {
  count: number;
}

interface CircuitOutput {
  /** The only thing disclosed on-chain: the new counter total */
  newCount: number;
  /** The ZK proof blob (opaque bytes in production) */
  proof: Uint8Array;
}

/**
 * Simulates the `increment` circuit from counter.compact.
 * Validates the private witness constraints locally, then produces a proof.
 * Returns ONLY the disclosed public output — NOT the private amount.
 */
function incrementCircuit(
  ledger: LedgerState,
  privateWitness: { getIncrementAmount: () => number },
): CircuitOutput {
  const amount = privateWitness.getIncrementAmount();

  // ZK constraints (asserted inside the circuit)
  if (amount <= 0) throw new Error('increment amount must be positive');
  if (amount > 1000) throw new Error('increment amount must not exceed 1000');

  const newCount = ledger.count + amount;

  // disclose(newCount) — only this reaches the chain
  return {
    newCount,
    proof: new Uint8Array([0xde, 0xad, 0xbe, 0xef]), // mock proof bytes
  };
}

/**
 * Simulates the `increment_if_positive` circuit (secret witness variant).
 */
function incrementIfPositiveCircuit(
  ledger: LedgerState,
  privateWitness: { getSecretAmount: () => number },
): CircuitOutput {
  const secretAmount = privateWitness.getSecretAmount();

  if (secretAmount <= 0) throw new Error('secret amount must be positive');
  if (secretAmount > 100) throw new Error('secret amount must not exceed 100');

  const newCount = ledger.count + secretAmount;

  return {
    newCount,
    proof: new Uint8Array([0xca, 0xfe, 0xba, 0xbe]),
  };
}

/**
 * Simulates the `reset` circuit.
 */
function resetCircuit(_ledger: LedgerState): CircuitOutput {
  return {
    newCount: 0,
    proof: new Uint8Array([0x00]),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite A — Circuit Logic
// Does the circuit compute the correct output for valid inputs?
// ─────────────────────────────────────────────────────────────────────────────

describe('A) Circuit Logic', () => {
  it('A.1 — increment circuit produces correct new counter total', () => {
    const ledger: LedgerState = { count: 10 };
    const witness = { getIncrementAmount: () => 5 };

    const output = incrementCircuit(ledger, witness);

    expect(output.newCount).toBe(15);
  });

  it('A.2 — increment_if_positive circuit uses secret amount correctly', () => {
    const ledger: LedgerState = { count: 0 };
    const witness = { getSecretAmount: () => 42 };

    const output = incrementIfPositiveCircuit(ledger, witness);

    expect(output.newCount).toBe(42);
  });

  it('A.3 — reset circuit always sets counter to zero regardless of current count', () => {
    const ledger: LedgerState = { count: 999 };

    const output = resetCircuit(ledger);

    expect(output.newCount).toBe(0);
  });

  it('A.4 — increment circuit with boundary amount 1 is valid', () => {
    const ledger: LedgerState = { count: 0 };
    const witness = { getIncrementAmount: () => 1 };

    const output = incrementCircuit(ledger, witness);

    expect(output.newCount).toBe(1);
  });

  it('A.5 — increment circuit with boundary amount 1000 is valid', () => {
    const ledger: LedgerState = { count: 0 };
    const witness = { getIncrementAmount: () => 1000 };

    const output = incrementCircuit(ledger, witness);

    expect(output.newCount).toBe(1000);
  });

  it('A.6 — increment rejects amount = 0 (must be positive)', () => {
    const ledger: LedgerState = { count: 5 };
    const witness = { getIncrementAmount: () => 0 };

    expect(() => incrementCircuit(ledger, witness)).toThrow(
      'increment amount must be positive',
    );
  });

  it('A.7 — increment rejects amount > 1000 (range constraint)', () => {
    const ledger: LedgerState = { count: 5 };
    const witness = { getIncrementAmount: () => 1001 };

    expect(() => incrementCircuit(ledger, witness)).toThrow(
      'increment amount must not exceed 1000',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite B — State Transitions
// Does the ledger state update correctly after each circuit call?
// ─────────────────────────────────────────────────────────────────────────────

describe('B) State Transitions', () => {
  let ledger: LedgerState;

  beforeEach(() => {
    ledger = { count: 0 };
  });

  it('B.1 — ledger count increases by the increment amount after a call', () => {
    const witness = { getIncrementAmount: () => 7 };
    const output = incrementCircuit(ledger, witness);

    // Apply disclosed output to ledger (what the node does on-chain)
    ledger.count = output.newCount;

    expect(ledger.count).toBe(7);
  });

  it('B.2 — multiple sequential increments accumulate correctly', () => {
    const increments = [3, 10, 50];
    let expectedCount = 0;

    for (const amount of increments) {
      const witness = { getIncrementAmount: () => amount };
      const output = incrementCircuit(ledger, witness);
      ledger.count = output.newCount;
      expectedCount += amount;
    }

    expect(ledger.count).toBe(expectedCount); // 63
  });

  it('B.3 — reset after increments brings counter back to zero', () => {
    // First increment
    const incOutput = incrementCircuit(ledger, { getIncrementAmount: () => 25 });
    ledger.count = incOutput.newCount;
    expect(ledger.count).toBe(25);

    // Now reset
    const resetOutput = resetCircuit(ledger);
    ledger.count = resetOutput.newCount;

    expect(ledger.count).toBe(0);
  });

  it('B.4 — increment_if_positive correctly transitions state', () => {
    const witness = { getSecretAmount: () => 15 };
    const output = incrementIfPositiveCircuit(ledger, witness);
    ledger.count = output.newCount;

    expect(ledger.count).toBe(15);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite C — Privacy
// Private inputs must NEVER appear in any circuit output or public state.
// ─────────────────────────────────────────────────────────────────────────────

describe('C) Privacy — private input is never exposed in any output', () => {
  it('C.1 — circuit output does not contain the private increment amount', () => {
    const ledger: LedgerState = { count: 10 };
    const privateAmount = 37; // the secret
    const witness = { getIncrementAmount: () => privateAmount };

    const output = incrementCircuit(ledger, witness);

    // The output object should only contain newCount and proof
    const outputKeys = Object.keys(output);
    expect(outputKeys).not.toContain('amount');
    expect(outputKeys).not.toContain('incrementAmount');
    expect(outputKeys).not.toContain('privateAmount');
    expect(outputKeys).not.toContain('witness');

    // The newCount is disclosed (public), but the raw amount is not
    expect(output.newCount).toBe(47); // 10 + 37 — total is public
    // We can only infer the amount if we knew the previous count;
    // the raw witness value itself is never present in the output.
  });

  it('C.2 — proof bytes do not encode the private witness value in plaintext', () => {
    const ledger: LedgerState = { count: 0 };
    const privateAmount = 99;
    const witness = { getIncrementAmount: () => privateAmount };

    const output = incrementCircuit(ledger, witness);

    // Serialize proof to check it does not contain the raw private value
    const proofStr = Array.from(output.proof)
      .map((b) => b.toString(10))
      .join(',');

    // The number 99 should not appear as a literal in the proof bytes
    expect(proofStr).not.toContain(String(privateAmount));
  });

  it('C.3 — the witness getter is called internally but its return value is not forwarded to output', () => {
    const ledger: LedgerState = { count: 5 };
    const spy = vi.fn().mockReturnValue(20);
    const witness = { getIncrementAmount: spy };

    const output = incrementCircuit(ledger, witness);

    // Witness was invoked (locally, inside the circuit)
    expect(spy).toHaveBeenCalledOnce();

    // But its return value (20) is not in any output field
    const outputValues = Object.values(output);
    const rawAmount = spy.mock.results[0].value;

    // newCount is 25 (5 + 20), not 20 itself
    expect(output.newCount).not.toBe(rawAmount);

    // No output field equals the raw private amount
    for (const val of outputValues) {
      if (typeof val === 'number') {
        expect(val).not.toBe(rawAmount);
      }
    }
  });

  it('C.4 — secret amount in increment_if_positive is not exposed', () => {
    const ledger: LedgerState = { count: 0 };
    const secretValue = 77;
    const witness = { getSecretAmount: () => secretValue };

    const output = incrementIfPositiveCircuit(ledger, witness);

    // Output has no field exposing the raw secret
    expect(output).not.toHaveProperty('secretAmount');
    expect(output).not.toHaveProperty('secret');
    expect(output).not.toHaveProperty('amount');
    // newCount is disclosed (public), but the secret is not
    expect(output.newCount).toBe(secretValue); // count was 0, so newCount = secret
    // The above is only possible because count was 0 — in any realistic scenario
    // the observer cannot recover the secret without knowing count.
  });
});
