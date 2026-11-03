import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { readFileSync } from "node:fs";

const metadataURI = process.argv[2];
const privateKey = process.env.BASE_SEPOLIA_PRIVATE_KEY;
if (!/^ipfs:\/\/(baf[a-z2-7]+|Qm[1-9A-HJ-NP-Za-km-z]{44})$/.test(metadataURI ?? "")) {
  throw new Error("Pass the Pinata metadata URI as ipfs://<CID>.");
}
if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey ?? "")) {
  throw new Error("Set BASE_SEPOLIA_PRIVATE_KEY in .env.local.");
}

const artifact = JSON.parse(readFileSync(new URL("../contracts/WorkshopNFT.json", import.meta.url), "utf8"));
const transport = http(process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org");
const publicClient = createPublicClient({ chain: baseSepolia, transport });
if (await publicClient.getChainId() !== baseSepolia.id) throw new Error("RPC is not Base Sepolia.");

const account = privateKeyToAccount(privateKey);
const walletClient = createWalletClient({ account, chain: baseSepolia, transport });
console.log(`Deploying from ${account.address} on Base Sepolia...`);
const hash = await walletClient.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode,
  args: [metadataURI],
});
console.log(`Transaction: https://sepolia.basescan.org/tx/${hash}`);
const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (receipt.status !== "success" || !receipt.contractAddress) throw new Error("Deployment failed. Check the transaction link.");
console.log(`Contract address: ${receipt.contractAddress}`);
