"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 10;
const CHAIN_ID = "0x14a34";

type EthereumProvider = {
  isMetaMask?: boolean;
  isPhantom?: boolean;
  providers?: EthereumProvider[];
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

type Receipt = { status: string };

function metamask(provider: EthereumProvider | null) {
  if (!provider) throw new Error("Install MetaMask to connect your wallet.");
  return provider;
}

function errorMessage(error: unknown) {
  if (typeof error === "object" && error && "code" in error && error.code === 4001) return "Request cancelled in MetaMask.";
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

async function responseJson(response: Response) {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The server request failed.");
  return result;
}

async function switchToBaseSepolia(provider: EthereumProvider) {
  if (await provider.request({ method: "eth_chainId" }) === CHAIN_ID) return;
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_ID }] });
  } catch (error) {
    if (typeof error !== "object" || !error || !("code" in error) || error.code !== 4902) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [{ chainId: CHAIN_ID, chainName: "Base Sepolia", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: ["https://sepolia.base.org"], blockExplorerUrls: ["https://sepolia.basescan.org"] }],
    });
  }
  if (await provider.request({ method: "eth_chainId" }) !== CHAIN_ID) throw new Error("Switch MetaMask to Base Sepolia.");
}

async function waitForReceipt(provider: EthereumProvider, hash: string): Promise<Receipt | null> {
  for (let attempt = 0; attempt < 60; attempt++) {
    const receipt = await provider.request({ method: "eth_getTransactionReceipt", params: [hash] }) as Receipt | null;
    if (receipt) return receipt;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return null;
}

export default function Home() {
  const [quantity, setQuantity] = useState(MIN_QUANTITY);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState<EthereumProvider | null>(null);

  useEffect(() => {
    let active = true;
    let foundMetaMask = false;
    const injected = (window as Window & { ethereum?: EthereumProvider }).ethereum;
    const announced = (event: Event) => {
      const detail = (event as CustomEvent<{ info?: { rdns?: string }; provider?: EthereumProvider }>).detail;
      if (detail?.info?.rdns === "io.metamask" && typeof detail.provider?.request === "function") {
        foundMetaMask = true;
        setProvider(detail.provider);
      }
    };
    window.addEventListener("eip6963:announceProvider", announced);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    queueMicrotask(() => {
      if (active && !foundMetaMask) setProvider(injected?.providers?.find((wallet) => wallet.isMetaMask && !wallet.isPhantom) ?? (injected?.isMetaMask && !injected.isPhantom ? injected : null));
    });
    return () => {
      active = false;
      window.removeEventListener("eip6963:announceProvider", announced);
    };
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const config = await responseJson(await fetch("/api/contract"));
        if (!config.address) throw new Error("Workshop contract is unavailable.");
        if (active) {
          setContractAddress(config.address);
          if (config.counter !== null) setQuantity(config.counter);
        }
      } catch (error) {
        if (active) setNotice(errorMessage(error));
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!provider) return;
    let active = true;
    const accountsChanged = (...args: unknown[]) => {
      const accounts = args[0];
      if (active) setAccount(Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : null);
    };
    const chainChanged = (...args: unknown[]) => {
      if (active) setChainId(typeof args[0] === "string" ? args[0] : null);
    };
    provider.on?.("accountsChanged", accountsChanged);
    provider.on?.("chainChanged", chainChanged);

    void (async () => {
      try {
        const accounts = await provider.request({ method: "eth_accounts" });
        const chain = await provider.request({ method: "eth_chainId" });
        if (active) {
          accountsChanged(accounts);
          chainChanged(chain);
        }
      } catch (error) {
        if (active) setNotice(errorMessage(error));
      }
    })();

    return () => {
      active = false;
      provider.removeListener?.("accountsChanged", accountsChanged);
      provider.removeListener?.("chainChanged", chainChanged);
    };
  }, [provider]);

  async function connectWallet() {
    setBusy(true);
    setNotice("");
    try {
      const wallet = metamask(provider);
      const accounts = await wallet.request({ method: "eth_requestAccounts" });
      if (!Array.isArray(accounts) || typeof accounts[0] !== "string") throw new Error("MetaMask did not return an account.");
      setAccount(accounts[0]);
      setChainId(await wallet.request({ method: "eth_chainId" }) as string);
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function disconnectWallet() {
    setBusy(true);
    setNotice("");
    try {
      await metamask(provider).request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
      setAccount(null);
      setChainId(null);
      setTxHash(null);
      setNotice("Wallet disconnected.");
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function changeCounter(action: "increment" | "decrement") {
    if (!account || !contractAddress) return;
    setBusy(true);
    setNotice("");
    setTxHash(null);
    try {
      const wallet = metamask(provider);
      await switchToBaseSepolia(wallet);
      const accounts = await wallet.request({ method: "eth_accounts" });
      if (!Array.isArray(accounts) || accounts[0]?.toLowerCase() !== account.toLowerCase()) throw new Error("Reconnect the selected MetaMask account.");
      const transaction = await responseJson(await fetch("/api/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, address: contractAddress, action }),
      }));
      const hash = await wallet.request({ method: "eth_sendTransaction", params: [{ from: account, to: transaction.to, data: transaction.data }] }) as string;
      setTxHash(hash);
      setNotice("Counter transaction submitted. Waiting for confirmation…");
      const receipt = await waitForReceipt(wallet, hash);
      if (!receipt) throw new Error("Counter update is still pending. Check the transaction link below.");
      if (receipt.status !== "0x1") throw new Error("Counter transaction failed.");
      const current = await responseJson(await fetch(`/api/contract?address=${contractAddress}`));
      setQuantity(current.counter);
      setNotice(`On-chain counter is now ${current.counter}.`);
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function mint() {
    if (!account || !contractAddress) return;
    setBusy(true);
    setNotice("");
    setTxHash(null);
    try {
      const wallet = metamask(provider);
      await switchToBaseSepolia(wallet);
      const accounts = await wallet.request({ method: "eth_accounts" });
      if (!Array.isArray(accounts) || accounts[0]?.toLowerCase() !== account.toLowerCase()) throw new Error("Reconnect the selected MetaMask account.");
      const current = await responseJson(await fetch(`/api/contract?address=${contractAddress}`));
      if (current.counter !== quantity) {
        setQuantity(current.counter);
        throw new Error("The shared counter changed. Review the quantity before minting.");
      }
      const transaction = await responseJson(await fetch("/api/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, address: contractAddress, action: "mint", quantity }),
      }));
      const hash = await wallet.request({ method: "eth_sendTransaction", params: [{ from: account, to: transaction.to, data: transaction.data }] }) as string;
      setTxHash(hash);
      setNotice("Mint submitted. Waiting for confirmation…");
      const receipt = await waitForReceipt(wallet, hash);
      if (!receipt) throw new Error("Mint is still pending. Check the transaction link below.");
      if (receipt.status !== "0x1") throw new Error("Mint transaction failed.");
      setNotice(`${quantity} ${quantity === 1 ? "pass" : "passes"} minted on Base Sepolia.`);
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="site-shell">
      <div className="page-wrap">
        <header className="site-header">
          <Image className="brand-logo" src="/cryptita-logo.png" alt="Cryptita Plays" width={2902} height={857} priority unoptimized />
          <div className="header-actions">
            <span className="header-label">EVM Workshop</span>
            <a className="github-button" href="https://github.com/owenlim225/CryptitaPlays_EVMWorkshop" aria-label="View project on GitHub" title="View project on GitHub">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.4 7.86 10.92.57.1.78-.25.78-.55v-2.14c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.25 3.33.96.1-.74.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.72 0-1.26.45-2.3 1.18-3.11-.12-.29-.51-1.47.11-3.07 0 0 .96-.31 3.15 1.19A10.95 10.95 0 0 1 12 6.12c.97 0 1.95.13 2.86.39 2.19-1.5 3.15-1.19 3.15-1.19.62 1.6.23 2.78.11 3.07.73.81 1.18 1.85 1.18 3.11 0 4.45-2.69 5.43-5.26 5.72.41.35.77 1.04.77 2.1v3.05c0 .3.21.66.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" /></svg>
            </a>
            {account ? (
              <>
                <span className="wallet-account" title={account}>{`${account.slice(0, 6)}…${account.slice(-4)}`}</span>
                <button type="button" className="wallet-button" onClick={disconnectWallet} disabled={busy}>Disconnect</button>
              </>
            ) : (
              <button type="button" className="wallet-button" onClick={connectWallet} disabled={busy}>Connect MetaMask</button>
            )}
          </div>
        </header>

        <section className="mint-page" aria-labelledby="page-title">
          <div className="intro">
            <h1 id="page-title">Mint your workshop pass.</h1>
            <p>Connect MetaMask, set the shared on-chain counter, and mint that many passes on Base Sepolia.</p>
            {account && chainId !== CHAIN_ID && <p className="network-note">MetaMask will ask you to switch to Base Sepolia.</p>}
          </div>

          <div className="mint-form">
            <div className="quantity-side">
              <div className="field-heading">
                <span id="quantity-label">On-chain counter</span>
                <span className="field-detail">1–{MAX_QUANTITY} passes</span>
              </div>
              <div className="quantity-control" role="group" aria-labelledby="quantity-label">
                <button type="button" onClick={() => changeCounter("decrement")} disabled={busy || !account || !contractAddress || quantity === MIN_QUANTITY} aria-label="Decrease counter">−</button>
                <output aria-live="polite" aria-label="On-chain counter">{contractAddress ? quantity : "—"}</output>
                <button type="button" onClick={() => changeCounter("increment")} disabled={busy || !account || !contractAddress || quantity === MAX_QUANTITY} aria-label="Increase counter">+</button>
              </div>
            </div>

            <div className="action-side">
              <span className="field-heading action-label">Ready to mint</span>
              <button type="button" className="mint-button" onClick={mint} disabled={busy || !account || !contractAddress}>
                <span>{busy ? "Waiting for MetaMask…" : "Mint"}</span>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>

          <p className="preview-note">The counter is shared across wallets. Each change and mint is a Base Sepolia transaction that requires test ETH for gas.</p>
          {contractAddress && <p className="contract-note">Contract: <a href={`https://sepolia.basescan.org/address/${contractAddress}`} target="_blank" rel="noreferrer">{contractAddress}</a></p>}
          {notice && <p className="mint-notice" role="status">{notice}</p>}
          {txHash && <p className="transaction-note"><a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer">View transaction on BaseScan</a></p>}
        </section>

        <footer className="site-footer">Cryptita Plays · EVM Workshop</footer>
      </div>
    </main>
  );
}
