import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edit, Deploy, and Mint | Cryptita Plays EVM Workshop",
  description: "Edit and deploy your NFT contract on Base Sepolia, then mint to your MetaMask wallet.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
