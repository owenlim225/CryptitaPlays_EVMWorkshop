import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mint Pass | Cryptita Plays EVM Workshop",
  description: "Connect MetaMask and mint a Cryptita Plays workshop pass on Base Sepolia.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
