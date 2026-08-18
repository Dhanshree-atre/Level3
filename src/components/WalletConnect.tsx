/**
 * WalletConnect.tsx
 * Handles Lace wallet connection UI with full error/loading states.
 * Shows contract address and connection status clearly.
 */

import type { WalletState } from '../hooks/useMidnight';

interface WalletConnectProps {
  walletState: WalletState;
  contractAddress: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WalletConnect({
  walletState,
  contractAddress,
  onConnect,
  onDisconnect,
}: WalletConnectProps) {
  const { status, address, error } = walletState;
  const isConnecting = status === 'connecting';
  const isConnected = status === 'connected';

  return (
    <section
      className="card wallet-card"
      aria-labelledby="wallet-section-title"
    >
      <div className="card-header">
        <h2 id="wallet-section-title" className="card-title">
          <span className="card-title-icon" aria-hidden="true">🔗</span>
          Wallet
        </h2>
        {isConnected && (
          <span className="chip chip--green" role="status">
            Connected
          </span>
        )}
      </div>

      {/* ── Contract address ── */}
      <div className="info-row">
        <span className="info-label">Contract</span>
        <span className="info-value mono" title={contractAddress}>
          {contractAddress.slice(0, 20)}…{contractAddress.slice(-8)}
        </span>
      </div>

      {/* ── Network badge ── */}
      <div className="info-row">
        <span className="info-label">Network</span>
        <span className="chip chip--blue">Preprod</span>
      </div>

      {/* ── Wallet address (when connected) ── */}
      {isConnected && address && (
        <div className="info-row">
          <span className="info-label">Address</span>
          <span className="info-value mono" title={address}>
            {address.slice(0, 16)}…{address.slice(-6)}
          </span>
        </div>
      )}

      {/* ── Error message ── */}
      {status === 'error' && error && (
        <div
          className="alert alert--error"
          role="alert"
          aria-live="assertive"
        >
          <span className="alert-icon">⚠️</span>
          <div>
            <strong>Connection failed</strong>
            <p>{error}</p>
            <p className="alert-hint">
              Make sure the Lace wallet extension is installed and set to
              Midnight Preprod.
            </p>
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      <div className="card-actions">
        {!isConnected ? (
          <button
            id="btn-connect-wallet"
            className="btn btn--primary"
            onClick={onConnect}
            disabled={isConnecting}
            aria-busy={isConnecting}
            aria-label="Connect Lace wallet"
          >
            {isConnecting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Connecting…
              </>
            ) : (
              'Connect Lace Wallet'
            )}
          </button>
        ) : (
          <button
            id="btn-disconnect-wallet"
            className="btn btn--ghost"
            onClick={onDisconnect}
            aria-label="Disconnect wallet"
          >
            Disconnect
          </button>
        )}
      </div>
    </section>
  );
}
