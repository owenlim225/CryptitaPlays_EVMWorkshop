import { createPublicClient, encodeFunctionData, http, isAddress, keccak256, type Abi, type Address } from "viem";
import { baseSepolia } from "viem/chains";
import artifact from "@/contracts/NFTA.json";
import workshopArtifact from "@/contracts/WorkshopNFT.json";

const client = createPublicClient({ chain: baseSepolia, transport: http(process.env.BASE_SEPOLIA_RPC_URL) });
const abi = artifact.abi as Abi;
const deployedCodeHashes = new Set([
  keccak256(artifact.deployedBytecode as `0x${string}`),
  keccak256(workshopArtifact.deployedBytecode as `0x${string}`),
]);
const defaultAddress = process.env.NFT_CONTRACT_ADDRESS || "0x288ad5fd9f3bd8b82580a1e723ec1747532e981d";

async function isCurrentContract(address: Address) {
  const code = await client.getBytecode({ address });
  return !!code && deployedCodeHashes.has(keccak256(code));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const candidate = url.searchParams.get("address") || defaultAddress;
  if (!isAddress(candidate)) {
    return Response.json({ error: "Contract address is invalid." }, { status: 400 });
  }

  try {
    if (await client.getChainId() !== baseSepolia.id) throw new Error("Wrong RPC network");
    const address = await isCurrentContract(candidate) ? candidate : null;
    const counter = address ? Number(await client.readContract({ address, abi, functionName: "counter" })) : null;
    return Response.json({ chainId: baseSepolia.id, address, counter });
  } catch {
    return Response.json({ error: "Could not read the contract on Base Sepolia." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { account, address, quantity, action } = body as Record<string, unknown>;
  if (typeof account !== "string" || !isAddress(account) ||
      typeof address !== "string" || !isAddress(address) ||
      (action !== "increment" && action !== "decrement" && action !== "mint") ||
      (action === "mint" && (!Number.isInteger(quantity) || Number(quantity) < 1 || Number(quantity) > 10))) {
    return Response.json({ error: "Account, contract address, action, or quantity is invalid." }, { status: 400 });
  }

  try {
    if (await client.getChainId() !== baseSepolia.id) {
      return Response.json({ error: "Backend RPC is not Base Sepolia." }, { status: 502 });
    }
    if (!await isCurrentContract(address as Address)) {
      return Response.json({ error: "This address is not the workshop NFT contract." }, { status: 400 });
    }
    const data = encodeFunctionData({ abi, functionName: action as string, args: action === "mint" ? [BigInt(quantity as number)] : [] });
    await client.call({ account: account as Address, to: address as Address, data });
    return Response.json({ chainId: baseSepolia.id, to: address, data });
  } catch {
    return Response.json({ error: "Transaction simulation failed on Base Sepolia. Check the counter and wallet balance." }, { status: 502 });
  }
}
