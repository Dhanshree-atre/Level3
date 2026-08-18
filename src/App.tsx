/**
 * App.tsx — Root application component
 * Composes WalletConnect + CircuitCall via useMidnight hook.
 */

import { WalletConnect } from './components/WalletConnect';
import { CircuitCall } from './components/CircuitCall';
import { useMidnight } from './hooks/useMidnight';

export default function App() {
  const {
    walletState,
    circuitState,
    contractAddress,
    connectWallet,
    disconnectWallet,
    callCircuit,
    resetCircuit,
  } = useMidnight();

  const isConnected = walletState.status === 'connected';

  return (
    <div className="app-shell">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="app-header" role="banner">
        <a href="/" className="app-logo" aria-label="Midnight Counter home">
          <div className="logo-icon" aria-hidden="true">⬡</div>
          <span className="logo-text">Midnight Counter</span>
          <span className="logo-badge">ZK</span>
        </a>

        <div
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          aria-live="polite"
          aria-label="Wallet connection status"
        >
          <span
            className={`status-dot ${isConnected ? 'online' : 'offline'}`}
            title={isConnected ? 'Connected' : 'Not connected'}
          />
          <span className="status-label">
            {isConnected ? 'Connected' : 'Not connected'}
          </span>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <main className="app-main" id="main-content">
        {/* Privacy notice banner */}
        <div className="privacy-banner" role="note" aria-label="Privacy guarantee">
          <span className="privacy-icon">🔒</span>
          <span>
            <strong>Privacy Guarantee:</strong> Your increment amount is processed
            as a zero-knowledge proof — it never leaves your browser.
          </span>
        </div>

        <div className="card-stack">
          <WalletConnect
            walletState={walletState}
            contractAddress={contractAddress}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
          />

          <CircuitCall
            circuitState={circuitState}
            isConnected={isConnected}
            onCallCircuit={callCircuit}
            onReset={resetCircuit}
          />
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="app-footer" role="contentinfo">
        <p>
          Built on{' '}
          <a
            href="https://midnight.network"
            target="_blank"
            rel="noopener noreferrer"
          >
            Midnight Network
          </a>{' '}
          · Privacy-preserving ZK proofs · Level 3 Challenge
        </p>
      </footer>
    </div>
  );
}
