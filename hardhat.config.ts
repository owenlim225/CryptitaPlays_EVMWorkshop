import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import hardhatViem from "@nomicfoundation/hardhat-viem";
import { configVariable, defineConfig } from "hardhat/config";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  plugins: [hardhatViem],
  solidity: {
    version: "0.8.28",
    path: fileURLToPath(new URL("./node_modules/solc/soljson.js", import.meta.url)),
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    baseSepolia: {
      type: "http",
      chainType: "op",
      chainId: 84532,
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: [configVariable("BASE_SEPOLIA_PRIVATE_KEY")],
    },
  },
});
