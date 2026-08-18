/**
 * useMidnight.ts
 * Custom React hook — manages wallet + circuit state for the Midnight Counter dApp.
 * All ZK proof generation happens locally in WASM; private values never leave the browser.
 */

import { useState, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export type WalletStatus = 'idle' | 'connecting' | 'connected' | 'error';
export type CircuitStatus = 'idle' | 'proving' | 'submitting' | 'success' | 'error';

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  error: string | null;
}

export interface CircuitState {
  status: CircuitStatus;
  count: number | null;
  txHash: string | null;
  error: string | null;
  /** How many circuits have been called in this session */
  callCount: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CONTRACT_ADDRESS =
  'mn_addr_preview1d7j37az8m5h6sgs3c6ufvwtg0cxxhtpdnh6yuve5cpkjjk8v8ersrsmfnx';

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useMidnight() {
  const [walletState, setWalletState] = useState<WalletState>({
    status: 'idle',
    address: null,
    error: null,
  });

  const [circuitState, setCircuitState] = useState<CircuitState>({
    status: 'idle',
    count: null,
    txHash: null,
    error: null,
    callCount: 0,
  });

  // ── connectWallet ──────────────────────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    setWalletState({ status: 'connecting', address: null, error: null });

    try {
      // In a real deployment this calls window.midnight?.lace?.enable()
      // Here we simulate the handshake for demonstration purposes.
      await simulateDelay(1200);

      const mockAddress = 'addr_test1qz...mid_demo_' + Math.random().toString(36).slice(2, 8);

      setWalletState({
        status: 'connected',
        address: mockAddress,
        error: null,
      });
    } catch (err) {
      setWalletState({
        status: 'error',
        address: null,
        error: err instanceof Error ? err.message : 'Failed to connect wallet',
      });
    }
  }, []);

  // ── disconnectWallet ───────────────────────────────────────────────────────
  const disconnectWallet = useCallback(() => {
    setWalletState({ status: 'idle', address: null, error: null });
    setCircuitState({
      status: 'idle',
      count: null,
      txHash: null,
      error: null,
      callCount: 0,
    });
  }, []);

  // ── callCircuit ────────────────────────────────────────────────────────────
  // Simulates the full ZK proof flow:
  //   1. Generate private witness locally (never leaves browser)
  //   2. Produce ZK proof in WASM
  //   3. Submit proof + public outputs on-chain
  const callCircuit = useCallback(
    async (incrementAmount?: number) => {
      if (walletState.status !== 'connected') {
        setCircuitState((prev) => ({
          ...prev,
          status: 'error',
          error: 'Wallet must be connected before calling a circuit.',
        }));
        return;
      }

      // Step 1 — local proof generation
      setCircuitState((prev) => ({
        ...prev,
        status: 'proving',
        error: null,
        txHash: null,
      }));
      await simulateDelay(2000);

      // Step 2 — submitting to network
      setCircuitState((prev) => ({ ...prev, status: 'submitting' }));
      await simulateDelay(1500);

      // Step 3 — success
      const amount = incrementAmount ?? Math.floor(Math.random() * 10) + 1;
      const newCount = (circuitState.count ?? 0) + amount;
      const txHash = '0x' + randomHex(64);

      setCircuitState((prev) => ({
        status: 'success',
        count: newCount,
        txHash,
        error: null,
        callCount: prev.callCount + 1,
      }));
    },
    [walletState.status, circuitState.count],
  );

  // ── resetCircuit ───────────────────────────────────────────────────────────
  const resetCircuit = useCallback(() => {
    setCircuitState({
      status: 'idle',
      count: null,
      txHash: null,
      error: null,
      callCount: 0,
    });
  }, []);

  return {
    walletState,
    circuitState,
    contractAddress: CONTRACT_ADDRESS,
    connectWallet,
    disconnectWallet,
    callCircuit,
    resetCircuit,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomHex(length: number): string {
  return Array.from({ length }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
}
