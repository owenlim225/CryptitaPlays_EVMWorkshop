"use client";

import { useState } from "react";

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 10;

export default function Home() {
  const [quantity, setQuantity] = useState(MIN_QUANTITY);
  const [notice, setNotice] = useState("");

  function changeQuantity(amount: number) {
    setQuantity((current) => Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, current + amount)));
    setNotice("");
  }

  function previewMint() {
    setNotice(`${quantity} ${quantity === 1 ? "pass" : "passes"} selected. Wallet and contract minting are not connected yet.`);
  }

  return (
    <main className="site-shell">
      <div className="page-wrap">
        <header className="site-header">
          <span className="brand">Cryptita Plays</span>
          <span className="header-label">EVM Workshop</span>
        </header>

        <section className="mint-page" aria-labelledby="page-title">
          <div className="intro">
            <h1 id="page-title">Mint your workshop pass.</h1>
            <p>Choose a quantity and preview the mint.</p>
          </div>

          <div className="mint-form">
            <div className="quantity-side">
              <div className="field-heading">
                <span id="quantity-label">Quantity</span>
                <span className="field-detail">1–{MAX_QUANTITY} passes</span>
              </div>
              <div className="quantity-control" role="group" aria-labelledby="quantity-label">
                <button type="button" onClick={() => changeQuantity(-1)} disabled={quantity === MIN_QUANTITY} aria-label="Decrease quantity">−</button>
                <output aria-live="polite" aria-label="Selected quantity">{quantity}</output>
                <button type="button" onClick={() => changeQuantity(1)} disabled={quantity === MAX_QUANTITY} aria-label="Increase quantity">+</button>
              </div>
            </div>

            <div className="action-side">
              <span className="field-heading action-label">Ready to mint</span>
              <button type="button" className="mint-button" onClick={previewMint}>
                <span>Mint</span>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>

          <p className="preview-note">Frontend preview only. No wallet or transaction required.</p>
          {notice && <p className="mint-notice" role="status">{notice}</p>}
        </section>

        <footer className="site-footer">Cryptita Plays · EVM Workshop</footer>
      </div>
    </main>
  );
}
