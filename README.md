# Cryptita Plays EVM Workshop

A Base Sepolia NFT mint page built with Next.js 16, React 19, MetaMask, and an ERC-721 contract.

## Run locally

```bash
npm ci
npm run dev
```

Open http://localhost:3000.

Connect MetaMask, switch to Base Sepolia when prompted, choose 1–10 passes, and select **Mint**. The wallet needs Base Sepolia test ETH for gas.

The deployed contract is [`0x731b13922e6701dcd58873bb4a395b2e426f508c`](https://sepolia.basescan.org/address/0x731b13922e6701dcd58873bb4a395b2e426f508c). It is the default across browsers. Set `NFT_CONTRACT_ADDRESS` in `.env.local` to override it for a future deployment. `BASE_SEPOLIA_RPC_URL` optionally overrides the public Base Sepolia RPC used for backend checks.

The backend checks that the address contains this contract's compiled code and simulates `mint(quantity)` before returning transaction data. MetaMask signs and broadcasts the transaction; the server never handles a private key. The contract and deployment artifact are in `contracts/`. After editing the Solidity source, run `npm run compile:contract` and redeploy; existing contracts cannot be updated in place.

Only the deploying wallet can call the contract's `increment()` and `decrement()` functions. Minting is open to any wallet and costs no mint fee, though network gas still applies.
