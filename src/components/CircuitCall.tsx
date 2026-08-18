/**
 * CircuitCall.tsx
 * ZK circuit interaction panel.
 * Shows loading spinner during proof generation, success/error states,
 * and clearly labels all private/public data.
 */

import { useState } from 'react';
import type { CircuitState } from '../hooks/useMidnight';

interface CircuitCallProps {
  circuitState: CircuitState;
  isConnected: boolean;
  onCallCircuit: (amount?: number) => void;
  onReset: () => void;
}

export function CircuitCall({
  circuitState,
  isConnected,
  onCallCircuit,
  onReset,
}: CircuitCallProps) {
  const { status, count, txHash, error, callCount } = circuitState;
  const [customAmount, setCustomAmount] = useState('');

  const isProving = status === 'proving';
  const isSubmitting = status === 'submitting';
  const isBusy = isProving || isSubmitting;
  const isSuccess = status === 'success';
  const isError = status === 'error';

  function handleIncrement() {
    const amt = customAmount !== '' ? parseInt(customAmount, 10) : undefined;
    if (amt !== undefined && (isNaN(amt) || amt <= 0 || amt > 1000)) {
      return; // HTML validation covers this, but guard anyway
    }
    onCallCircuit(amt);
  }

  return (
    <section
      className="card circuit-card"
      aria-labelledby="circuit-section-title"
    >
      <div className="card-header">
        <h2 id="circuit-section-title" className="card-title">
          <span className="card-title-icon" aria-hidden="true">⚡</span>
          ZK Circuit
        </h2>
        {callCount > 0 && (
          <span className="chip chip--dim" aria-label={`${callCount} calls`}>
            {callCount} call{callCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Privacy model labels ── */}
      <div className="privacy-model" aria-label="Privacy model">
        <div className="privacy-row">
          <span className="privacy-tag privacy-tag--public">PUBLIC</span>
          <span className="privacy-desc">
            Counter total — stored on ledger, visible to all
          </span>
        </div>
        <div className="privacy-row">
          <span className="privacy-tag privacy-tag--private">PRIVATE</span>
          <span className="privacy-desc">
            Increment amount — proved via ZK, never transmitted
          </span>
        </div>
      </div>

      {/* ── Current counter value ── */}
      {count !== null && (
        <div className="counter-display" aria-live="polite" aria-label={`Counter: ${count}`}>
          <span className="counter-label">On-chain Counter</span>
          <span className="counter-value">{count}</span>
          <span className="counter-public-badge">PUBLIC</span>
        </div>
      )}

      {/* ── Custom amount input ── */}
      {isConnected && (
        <div className="input-group">
          <label htmlFor="increment-amount" className="input-label">
            Increment amount
            <span className="input-hint">(1–1000, private)</span>
          </label>
          <input
            id="increment-amount"
            className="input-field"
            type="number"
            min="1"
            max="1000"
            placeholder="Leave blank for random"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            disabled={isBusy}
            aria-describedby="amount-hint"
          />
          <p id="amount-hint" className="field-hint">
            🔒 This value is a <em>private witness</em> — it is never sent to
            the network.
          </p>
        </div>
      )}

      {/* ── Proving / submitting spinner ── */}
      {isBusy && (
        <div
          className="status-banner status-banner--proving"
          role="status"
          aria-live="polite"
          aria-label={isProving ? 'Generating ZK proof' : 'Submitting to network'}
        >
          <span className="spinner spinner--lg" aria-hidden="true" />
          <div>
            <strong>
              {isProving ? 'Generating ZK proof…' : 'Submitting to network…'}
            </strong>
            <p className="status-sub">
              {isProving
                ? 'Your private input is being converted to a zero-knowledge proof locally in your browser.'
                : 'Sending proof and public outputs to the Midnight Preprod network.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Success state ── */}
      {isSuccess && txHash && (
        <div
          className="status-banner status-banner--success"
          role="status"
          aria-live="polite"
        >
          <span className="status-icon" aria-hidden="true">✅</span>
          <div>
            <strong>Transaction confirmed</strong>
            <p className="status-sub">
              Counter updated publicly. Your increment amount remains private.
            </p>
            <p className="tx-hash mono">
              Tx:{' '}
              <span title={txHash}>
                {txHash.slice(0, 18)}…{txHash.slice(-8)}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* ── Error state ── */}
      {isError && error && (
        <div
          className="alert alert--error"
          role="alert"
          aria-live="assertive"
        >
          <span className="alert-icon">⚠️</span>
          <div>
            <strong>Circuit call failed</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="card-actions">
        <button
          id="btn-increment"
          className="btn btn--primary"
          onClick={handleIncrement}
          disabled={!isConnected || isBusy}
          aria-busy={isBusy}
          aria-label="Call increment circuit with ZK proof"
        >
          {isBusy ? (
            <>
              <span className="spinner" aria-hidden="true" />
              {isProving ? 'Proving…' : 'Submitting…'}
            </>
          ) : (
            '⚡ Increment (ZK Proof)'
          )}
        </button>

        {(isSuccess || isError) && (
          <button
            id="btn-reset"
            className="btn btn--ghost"
            onClick={onReset}
            aria-label="Reset circuit state"
          >
            Reset
          </button>
        )}
      </div>

      {!isConnected && (
        <p
          className="connect-prompt"
          role="note"
          aria-label="Connect wallet prompt"
        >
          Connect your Lace wallet above to interact with the circuit.
        </p>
      )}
    </section>
  );
}
