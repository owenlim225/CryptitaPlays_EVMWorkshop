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

type Receipt = { status: string; contractAddress?: string | null };

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
        if (active) setContractAddress(config.address);
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

  function changeQuantity(amount: number) {
    setQuantity((current) => Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, current + amount)));
    setNotice("");
  }

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
      const transaction = await responseJson(await fetch("/api/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, address: contractAddress, quantity }),
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
            <button type="button" className="wallet-button" onClick={connectWallet} disabled={busy}>
              {account ? `${account.slice(0, 6)}…${account.slice(-4)}` : "Connect MetaMask"}
            </button>
          </div>
        </header>

        <section className="mint-page" aria-labelledby="page-title">
          <div className="intro">
            <h1 id="page-title">Mint your workshop pass.</h1>
            <p>Connect MetaMask, choose a quantity, and mint on Base Sepolia.</p>
            {account && chainId !== CHAIN_ID && <p className="network-note">MetaMask will ask you to switch to Base Sepolia.</p>}
          </div>

          <div className="mint-form">
            <div className="quantity-side">
              <div className="field-heading">
                <span id="quantity-label">Quantity</span>
                <span className="field-detail">1–{MAX_QUANTITY} passes</span>
              </div>
              <div className="quantity-control" role="group" aria-labelledby="quantity-label">
                <button type="button" onClick={() => changeQuantity(-1)} disabled={busy || quantity === MIN_QUANTITY} aria-label="Decrease quantity">−</button>
                <output aria-live="polite" aria-label="Selected quantity">{quantity}</output>
                <button type="button" onClick={() => changeQuantity(1)} disabled={busy || quantity === MAX_QUANTITY} aria-label="Increase quantity">+</button>
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

          <p className="preview-note">Base Sepolia testnet. Deployment and minting require test ETH for gas.</p>
          {contractAddress && <p className="contract-note">Contract: <a href={`https://sepolia.basescan.org/address/${contractAddress}`} target="_blank" rel="noreferrer">{contractAddress}</a></p>}
          {notice && <p className="mint-notice" role="status">{notice}</p>}
          {txHash && <p className="transaction-note"><a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer">View transaction on BaseScan</a></p>}
        </section>

        <footer className="site-footer">Cryptita Plays · EVM Workshop</footer>
      </div>
    </main>
  );
}
