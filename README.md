# Midnight Counter

![CI](https://github.com/Dhanshree-atre/Level3/actions/workflows/ci.yml/badge.svg?branch=main)

> A privacy-preserving ZK dApp on Midnight Network — increment an on-chain counter while keeping your input completely private via zero-knowledge proofs.

## Live Demo

[https://level2-ten.vercel.app/](https://level2-ten.vercel.app/)

## Contract Address

| Network  | Address                                                                         |
|----------|---------------------------------------------------------------------------------|
| Preprod  | `mn_addr_preview1d7j37az8m5h6sgs3c6ufvwtg0cxxhtpdnh6yuve5cpkjjk8v8ersrsmfnx` |

## What This Does

This dApp connects to a Midnight Preprod smart contract that implements a privacy-preserving counter. Users can:

- **Connect** their Lace wallet to the Midnight Preprod network
- **Call the `increment` circuit** — which generates a zero-knowledge proof locally in the browser
- **Submit the proof on-chain** — only the new counter total is disclosed; the private increment amount is never revealed
- **Reset** the counter (public operation, no witness required)

The contract demonstrates Midnight's core privacy model: the on-chain ledger stores only the running counter total, while increment amounts are proven valid via ZK proofs without ever leaving the user's device.

## Privacy Model

- **PUBLIC:** The current counter value (`count`) — stored in the ledger, queryable by anyone. The fact that an increment or reset transaction occurred. The transaction hash and block it was included in.
- **PRIVATE:** `get_increment_amount()` — the exact amount used in `increment()`, generated locally in the browser. `get_secret_amount()` — the amount used in `increment_if_positive()`. These values live only in the prover's local WASM environment; they are **never transmitted**.
- **PROVED without revealing:** That `incrementAmount > 0` and `incrementAmount <= 1000` (via ZK proof). That `secretAmount > 0` and `secretAmount <= 100` (via ZK proof). The resulting new counter total is disclosed (via `disclose()`) so the chain can validate the state update. The actual private values are **never transmitted, stored, or revealed**.

## Privacy Claim

**An on-chain observer can see:**
- That a counter increment transaction occurred
- The new counter total after the increment
- The transaction hash and block number

**An on-chain observer cannot see:**
- The amount by which the counter was incremented
- Any information about the user's private witness value
- The inputs to the ZK circuit

The Midnight protocol's ZK proof system mathematically guarantees that the increment amount remains private even from the blockchain nodes processing the transaction.

## Tech Stack

- **Midnight Network** — Privacy-focused blockchain with native ZK proofs
- **Compact** — Smart contract language compiling to ZK circuits
- **Midnight.js SDK** (`@midnight-ntwrk/dapp-connector-api`) — Browser wallet connector
- **React 18** + **TypeScript** — Frontend framework
- **Vite 5** — Build tool with ESNext/WASM support
- **Vitest** — Test framework for circuit and state logic
- **GitHub Actions** — CI/CD pipeline

## Prerequisites

- Node.js v22+
- npm v10+
- [Lace Wallet](https://www.lace.io/) browser extension (set to Midnight Preprod network)
- (Optional) `compact` CLI for contract compilation

## Setup & Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/Dhanshree-atre/Level3.git
cd Level3/my-project

# 2. Install dependencies
npm install

# 3. (Optional) Compile the Compact contract
compact compile contracts/counter.compact

# 4. Start the dev server
npm run dev

# 5. Open your browser at http://localhost:5173
```

## Run Tests

```bash
npm test
```

Expected output — all 15 tests pass across 3 suites:

```
✓ A) Circuit Logic (7 tests)
✓ B) State Transitions (4 tests)
✓ C) Privacy — private input is never exposed in any output (4 tests)

Test Files  1 passed (1)
Tests       15 passed (15)
```

## CI/CD

The GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on every push to `main` and every pull request:

1. **Checkout** — fetches the latest code
2. **Node.js 22** — sets up the correct runtime
3. **`npm ci`** — installs locked dependencies
4. **`compact compile`** — compiles the Compact smart contract to ZK circuits (skipped gracefully if compiler not installed in CI)
5. **`npm test`** — runs the full Vitest suite (must pass — 15 tests)
6. **`npm run build`** — produces a production bundle with zero errors

The CI badge at the top of this file reflects the live pipeline status.

## Product Proposal

See [PROPOSAL.md](./PROPOSAL.md) for the full product proposal including the data model and mainnet feasibility assessment.
