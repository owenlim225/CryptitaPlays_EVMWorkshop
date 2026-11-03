import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const solc = require("solc");
const root = resolve(import.meta.dirname, "..");
const sources = ["contracts/NFTA.sol", "contracts/WorkshopNFT.sol"];
const input = {
  language: "Solidity",
  sources: Object.fromEntries(sources.map((source) => [source, { content: readFileSync(resolve(root, source), "utf8") }])),
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] } },
  },
};
const output = JSON.parse(solc.compile(JSON.stringify(input), {
  import: (name) => {
    try {
      return { contents: readFileSync(resolve(root, "node_modules", name), "utf8") };
    } catch {
      return { error: `Missing import: ${name}` };
    }
  },
}));

for (const error of output.errors ?? []) {
  if (error.severity === "error") throw new Error(error.formattedMessage);
}

for (const [source, name] of [["contracts/NFTA.sol", "MyNFT"], ["contracts/WorkshopNFT.sol", "WorkshopNFT"]]) {
  const contract = output.contracts[source][name];
  writeFileSync(resolve(root, source.replace(/\.sol$/, ".json")), JSON.stringify({
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
    deployedBytecode: `0x${contract.evm.deployedBytecode.object}`,
  }, null, 2) + "\n");
}
console.log("Compiled MyNFT and WorkshopNFT.");
