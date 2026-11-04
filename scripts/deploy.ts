import { network } from "hardhat";

const { viem } = await network.create();
const contract = await viem.deployContract("MyNFT");

console.log(`MyNFT contract address: ${contract.address}`);
