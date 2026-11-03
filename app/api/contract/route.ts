import { createPublicClient, encodeFunctionData, http, isAddress, keccak256, type Abi, type Address } from "viem";
import { baseSepolia } from "viem/chains";
import artifact from "@/contracts/NFTA.json";

const client = createPublicClient({ chain: baseSepolia, transport: http(process.env.BASE_SEPOLIA_RPC_URL) });
const abi = artifact.abi as Abi;
const deployedCodeHash = keccak256(artifact.deployedBytecode as `0x${string}`);
const contractAddress = process.env.NFT_CONTRACT_ADDRESS || "0x731b13922e6701dcd58873bb4a395b2e426f508c";

export async function GET() {
  if (!isAddress(contractAddress)) {
    return Response.json({ error: "NFT_CONTRACT_ADDRESS is invalid." }, { status: 500 });
  }

  return Response.json({
    chainId: baseSepolia.id,
    address: contractAddress,
  });
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
  const { account, address, quantity } = body as Record<string, unknown>;
  if (typeof account !== "string" || !isAddress(account) ||
      typeof address !== "string" || !isAddress(address) ||
      !Number.isInteger(quantity) || Number(quantity) < 1 || Number(quantity) > 10) {
    return Response.json({ error: "Account, contract address, or quantity is invalid." }, { status: 400 });
  }
  if (address.toLowerCase() !== contractAddress.toLowerCase()) {
    return Response.json({ error: "Contract address does not match this deployment." }, { status: 400 });
  }

  try {
    if (await client.getChainId() !== baseSepolia.id) {
      return Response.json({ error: "Backend RPC is not Base Sepolia." }, { status: 502 });
    }
    const code = await client.getBytecode({ address: address as Address });
    if (!code || keccak256(code) !== deployedCodeHash) {
      return Response.json({ error: "This address is not the workshop NFT contract." }, { status: 400 });
    }
    const data = encodeFunctionData({ abi, functionName: "mint", args: [BigInt(quantity as number)] });
    await client.call({ account: account as Address, to: address as Address, data });
    return Response.json({ chainId: baseSepolia.id, to: address, data });
  } catch {
    return Response.json({ error: "Mint simulation failed on Base Sepolia. Check the contract and wallet balance." }, { status: 502 });
  }
}
