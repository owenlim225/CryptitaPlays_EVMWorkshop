import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mint Pass | Cryptita Plays EVM Workshop",
  description: "A frontend preview of the Cryptita Plays EVM Workshop mint experience.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
