# Cryptita Plays EVM Workshop

A Base Sepolia NFT mint page built with Next.js 16, React 19, MetaMask, and an ERC-721 contract.

## Run locally

```bash
npm ci
npm run dev
```

Open http://localhost:3000.

Connect MetaMask. The `+` and `−` buttons call `increment()` and `decrement()` on-chain, then **Mint** mints the displayed number of passes. Every action needs Base Sepolia test ETH for gas.

The [updated contract](https://sepolia.basescan.org/address/0x288ad5fd9f3bd8b82580a1e723ec1747532e981d) is the default across browsers. Set `NFT_CONTRACT_ADDRESS` in `.env.local` only to use a future replacement and restart the server. `BASE_SEPOLIA_RPC_URL` optionally overrides the public Base Sepolia RPC used for backend checks.

The backend checks that the address contains this contract's compiled code and simulates `mint(quantity)` before returning transaction data. MetaMask signs and broadcasts the transaction; the server never handles a private key. The contract and deployment artifact are in `contracts/`. After editing the Solidity source, run `npm run compile:contract` and redeploy; existing contracts cannot be updated in place.

The `counter` starts at 1, is shared across wallets, and is limited to 1–10 to match the mint quantity. Any wallet can change it or mint. There is no mint fee, though network gas still applies.
