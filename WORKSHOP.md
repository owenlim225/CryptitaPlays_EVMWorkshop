# NFT creation workshop: Pinata to Base Sepolia

In this workshop, you will upload an image and NFT metadata to Pinata, deploy your own NFT contract on **Base Sepolia**, then mint through this project's web page. The image and metadata are two separate uploads. Save both CIDs.

## Before you start

- Install Node.js 20.9 or newer, Git, VS Code, and the MetaMask browser extension.
- Create or sign in to a [Pinata account](https://app.pinata.cloud/).
- Use a **test wallet** in MetaMask and get **Base Sepolia ETH** for deployment and mint gas. Ask a facilitator or use the [Coinbase Developer Platform faucet](https://www.coinbase.com/developer-platform/products/faucet). Ethereum Sepolia ETH is on a different network.
- Select **Base Sepolia** in MetaMask. Its chain ID is `84532` (`0x14a34`). The project can prompt MetaMask to add or switch to it when minting.

## 1. Get the project ready

Open a terminal in the folder where you keep projects:

```bash
git clone https://github.com/owenlim225/CryptitaPlays_EVMWorkshop.git
cd CryptitaPlays_EVMWorkshop
npm ci
code .
```

You can use the VS Code terminal for the remaining commands. This repository uses Next.js and `solc`; the predecessor workshop's Hardhat command does not apply here.

## 2. Upload your image to Pinata

1. Prepare one image you are allowed to publish (for example, `my-pass.png`). Anyone with the CID can retrieve a public IPFS upload.
2. Open [Pinata Files](https://app.pinata.cloud/ipfs/files). Choose the file upload action (the button may say **Add** or **Upload**), select your image, and wait until the upload finishes.
3. Copy the image's **CID** from its file row or details. A CID is the content identifier, not the display name or the entire gateway link. Write it down as `IMAGE_CID`.
4. Click the uploaded file to check that the image opens. Its gateway URL will look like `https://YOUR_GATEWAY.mypinata.cloud/ipfs/IMAGE_CID`.

## 3. Create the NFT metadata file

In VS Code, create `metadata.json` in your own working folder. Paste this JSON and replace the sample words and `IMAGE_CID`:

```json
{
  "name": "My Workshop Pass",
  "description": "An NFT made during the Cryptita Plays EVM workshop.",
  "image": "ipfs://IMAGE_CID"
}
```

Keep the double quotes and commas. The `image` value should use the image **CID**, with `ipfs://` in front. Do not paste the Pinata dashboard URL into this field. Save the file with a real `.json` extension, not `.json.txt`.

For this workshop, every NFT minted from your contract will use this same metadata file and image.

## 4. Upload the metadata file to Pinata

1. Return to [Pinata Files](https://app.pinata.cloud/ipfs/files). Upload **`metadata.json`** as a second file.
2. Copy its new **CID** and write it down as `METADATA_CID`. It will differ from `IMAGE_CID`.
3. Open the uploaded JSON through Pinata's gateway. Check that it shows your `name`, `description`, and `image` with the **image CID**. If you fix the JSON and upload it again, use the **new metadata CID** in the next step; IPFS content does not change under an old CID.

Your two pointers should now be:

```text
Image in metadata:       ipfs://IMAGE_CID
Contract metadata URI:   ipfs://METADATA_CID
```

## 5. Prepare your deployment wallet

This terminal deployment uses a private key, as in the predecessor workshop. Use only your test wallet. **Never paste the key into chat, commit it, or send it to a facilitator.**

1. In MetaMask, select the test account you funded on **Base Sepolia**. Use its account menu to reveal/export its private key and enter your MetaMask password when asked. Copy the key privately.
2. In the repository root, create a file named `.env.local` in VS Code. Add this line with your own key, including `0x`:

   ```text
   BASE_SEPOLIA_PRIVATE_KEY=0xYOUR_64_HEX_CHARACTER_PRIVATE_KEY
   ```

3. Save the file. The repository ignores `.env.local`; keep the key on your own computer. If a facilitator provided test ETH, share only your **public wallet address** with them.

## 6. Compile and deploy your contract

Run these commands from the repository root, replacing `METADATA_CID` with the CID from step 4:

```bash
npm run compile:contract
npm run deploy:workshop -- ipfs://METADATA_CID
```

The script checks that the RPC is Base Sepolia, submits the contract deployment, waits for confirmation, then prints a **contract address**. Copy that address, starting with `0x`. The printed BaseScan transaction link lets you check the deployment. If you need a different RPC, set `BASE_SEPOLIA_RPC_URL` in `.env.local` to a Base Sepolia endpoint.

The contract stores the metadata URI at deployment. To use a different metadata CID later, deploy a new contract. Editing a local file will not change a deployed contract.

## 7. Mint on the workshop page

1. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).
2. Paste **your contract address** into **Your workshop contract address** and click **Use contract**. Do not paste a Pinata link or a transaction hash there. The page checks that this is a supported workshop NFT contract on Base Sepolia.
3. Click **Connect MetaMask**. Use the same funded test wallet and approve the Base Sepolia network switch if asked.
4. Leave the counter at `1` for one NFT, or use `+`/`−` to change it. Each counter change is its own transaction and costs test ETH for gas. The counter is shared by everyone using your contract.
5. Click **Mint**, review the MetaMask transaction, and confirm it. Open the transaction link shown on the page to see the confirmed mint on BaseScan.

The page remembers the address on this browser. **Use default** returns to the project's shared demo contract. Your contract has its own counter and NFTs. If your NFT image does not appear in a wallet immediately, first reopen the metadata file in Pinata and confirm its `image` CID is correct.

## What changed from the predecessor workshop

| Old step | Current project |
| --- | --- |
| Clone `RT7th/1026BB` | Clone this repository. |
| Copy an existing NFT's JSON from a Solidity link | Create your own `metadata.json` and upload it after the image. |
| Paste Pinata gateway links into code | Use `ipfs://IMAGE_CID` in JSON, then deploy with `ipfs://METADATA_CID`. |
| Run `npx hardhat ... --network sepolia` | Run this project's `compile:contract` and `deploy:workshop` commands on **Base Sepolia**. |
| Import ABI into `abi.ninja` to mint | Select your contract on this project's mint page. |

References: [Pinata's file upload guide](https://pinata.cloud/blog/how-to-use-pinata-a-step-by-step-guide-for-beginners/), [Pinata's NFT metadata guide](https://knowledge.pinata.cloud/en/articles/5455523-nfts-and-pinata), and [Base Sepolia chain ID](https://docs.base.org/base-chain/api-reference/ethereum-json-rpc-api/eth_chainId).
