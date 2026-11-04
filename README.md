# Cryptita Plays EVM Workshop

Create NFT metadata on Pinata, put its JSON link in the `MyNFT` smart contract, deploy to **Base Sepolia**, and mint from this Next.js page. Upload the **image first** and the **JSON file second**: the JSON needs the image link, and the contract needs the JSON link.

## Before you start

- Install Node.js 22.13 or newer, Git, and VS Code.
- Sign in to [Pinata](https://app.pinata.cloud/).

## Set up MetaMask and receive Base Sepolia test ETH

1. Go to the [official MetaMask site](https://metamask.io/), choose your browser, and install the MetaMask extension from its browser's extension store. Open the extension and select **Create a new wallet**. Follow the prompts to set a password and secure the wallet. If you choose a **12-word Secret Recovery Phrase**, write the words in order and keep them private and offline. Anyone with those words can control your wallet; never give them to a facilitator, enter them into a website, or put them in a QR code. See MetaMask's [installation](https://support.metamask.io/hc/en-us/articles/360015489531) and [wallet creation](https://support.metamask.io/start/creating-a-new-wallet) guides.
2. In MetaMask, open **Networks** (or **Network** > **Manage networks**), turn on **Show test networks** if needed, and choose **Add a custom network** > **Add from Chainlist** if that option appears. Search for **Base Sepolia**, select it, and approve or **Save** the network in MetaMask. If your version does not show **Add from Chainlist**, follow MetaMask's [Chainlist instructions](https://support.metamask.io/configure/networks/how-to-add-a-custom-network-rpc) from the official [Chainlist site](https://chainid.network/). Check that the network is **Base Sepolia**, with chain ID `84532` (`0x14a34`), rather than Base Mainnet or Ethereum Sepolia.
3. Back on MetaMask's **Tokens** tab, open the **Enabled networks** or selected-network filter and select **Base Sepolia** so its test ETH balance is visible. Adding a network and including it in this asset filter are separate steps. See MetaMask's [network filter guide](https://support.metamask.io/configure/networks/how-to-change-networks).
4. Click your account's **Ethereum/EVM public address** in MetaMask to copy it. It should start with `0x`. Paste it into the **Text** option at [QR Code Generator](https://www.qr-code-generator.com/) to create a static QR code. Scan the code yourself and compare the full decoded address with MetaMask before showing the QR code and address to a live facilitator. Share only this public address, never your recovery phrase or private key. See MetaMask's [address guide](https://support.metamask.io/configure/wallet/how-to-copy-your-metamask-account-public-address-/) and the generator's [static QR code guide](https://support.qr-code-generator.com/hc/en-us/articles/7664248839053-How-can-I-create-a-Static-QR-Code-without-an-account).
5. Ask the facilitator to send **Base Sepolia test ETH** to that address, or use a [Base Sepolia faucet](https://www.coinbase.com/developer-platform/products/faucet). Confirm with the facilitator that they are sending on **Base Sepolia**. Wait for the balance to appear in MetaMask before deploying or minting. Ethereum Sepolia ETH is on a different network; testnet ETH has no real-world value.

## 1. Open the project in VS Code

In a terminal, run:

```bash
git clone https://github.com/owenlim225/CryptitaPlays_EVMWorkshop.git
cd CryptitaPlays_EVMWorkshop
npm ci
code .
```

Use the VS Code terminal for the remaining commands. If you already have the project, open its folder and run `npm ci`.

## 2. Upload your image to Pinata

1. Choose an image you are allowed to publish, such as `my-nft.png`.
2. In [Pinata Files](https://app.pinata.cloud/ipfs/files), upload the image as a **public IPFS file**. Wait for the upload to finish.
3. Copy its public gateway link. It should look like `https://YOUR_GATEWAY.mypinata.cloud/ipfs/IMAGE_CID`. Open the link in a browser to confirm it displays the image.

Keep this **image link** handy. It goes in the JSON file, not in the smart contract.

## 3. Create the JSON metadata file

In VS Code, create a file named `metadata.json`. Paste valid JSON like this, then replace the example values and the `image` link with your own:

```json
{
  "name": "MARSU1142026",
  "description": "Marinduque State University 2026",
  "symbol": "MAR",
  "image": "https://moccasin-impressive-cougar-51.mypinata.cloud/ipfs/bafybeidzjuczy43igklykwiy4vgpf7paqivhf63cvnxikyeocqn2lzdxiu",
  "attributes": [
    { "trait_type": "ilanMgaPogi", "value": "MaramiDaw" },
    { "trait_type": "pogi level", "value": "Sagad" },
    { "trait_type": "era", "value": "panahon ng mga pogi" },
    {
      "trait_type": "ManifestFile",
      "value": "https://ivory-additional-snail-831.mypinata.cloud/ipfs/bafkreidawkpo4rxopssxmwxs36fajd5vwh7z63k6mdxxlbkb4dby7re6ru"
    }
  ]
}
```

The `ManifestFile` attribute is optional. If you do not have a manifest, delete that attribute and the comma after the `era` attribute. Keep the file as plain JSON: use normal double quotes, `https://` without a backslash, and the `.json` extension (not `.json.txt`). The JSON `symbol` is metadata; the collection name and symbol shown by the contract come from its constructor in step 5.

## 4. Upload the JSON to Pinata and copy its link

1. Return to [Pinata Files](https://app.pinata.cloud/ipfs/files) and upload `metadata.json` as a **second public IPFS file**.
2. Copy the **JSON file's public gateway link**, not the image link or the Pinata dashboard URL. For example:

   ```text
   https://moccasin-impressive-cougar-51.mypinata.cloud/ipfs/bafkreifgui54qw2qqcg3rlo3lojlpd7ofv5azrmbhmdqtnc5fjihat7snm
   ```

3. Open that link in a browser. Check that it returns your JSON and that its `image` link opens the image. If you change and reupload the JSON, copy its **new** link; changing a local file cannot change an existing IPFS CID.

## 5. Put the JSON link in the smart contract

In VS Code, open [`contracts/NFTA.sol`](contracts/NFTA.sol). Find `TOKEN_URI` in `MyNFT` and replace the URL between the quotes with **your JSON gateway link from step 4**:

```solidity
string private constant TOKEN_URI = "https://moccasin-impressive-cougar-51.mypinata.cloud/ipfs/bafkreifgui54qw2qqcg3rlo3lojlpd7ofv5azrmbhmdqtnc5fjihat7snm";
```

That sample link is already in the starter contract. Replace it if you uploaded your own JSON. Do not put the image link here: `TOKEN_URI` must return the JSON metadata.

You may also change the collection name and symbol in the constructor, for example `ERC721("MARSU1142026", "MAR")`. These are on-chain values; editing `name` or `symbol` in the JSON alone will not change them. Save `NFTA.sol`.

## 6. Prepare a deployment wallet

Deployment needs a funded **Base Sepolia test wallet**. In MetaMask, export that test account's private key privately. Never use a wallet that holds real assets, paste the key into chat, or commit it to Git.

In the project root, create `.env.local` with:

```text
BASE_SEPOLIA_PRIVATE_KEY=0xYOUR_64_HEX_CHARACTER_TEST_PRIVATE_KEY
```

The key must start with `0x`. This repository ignores `.env.local`. Share only your **public wallet address** if someone is sending you test ETH.

## 7. Compile and redeploy `MyNFT`

To mint from your edited `contracts/NFTA.sol`, run these commands from the project root:

```bash
npm run compile:contract
npm run deploy:mynft
```

Compilation refreshes `contracts/NFTA.json`, which the deployment command and mint page both use. The deploy command checks the Base Sepolia network, sends a deployment transaction, and prints a **new contract address** beginning with `0x`. Copy it. You can open the printed BaseScan transaction link to confirm deployment. If the public RPC is unavailable, add `BASE_SEPOLIA_RPC_URL=YOUR_BASE_SEPOLIA_RPC_URL` to `.env.local` and rerun deployment.

Each edit to `TOKEN_URI` or the constructor requires compiling and deploying again. The new contract starts with its own token IDs and counter. Previously minted NFTs keep their original URI.

**Alternative: deploy `WorkshopNFT`.** Run `npm run deploy:workshop -- ipfs://METADATA_CID`, replacing `METADATA_CID` with the CID of your metadata JSON. This contract takes its URI from the command line, so you can skip editing `NFTA.sol`. Continue to step 8 using the address printed by this command.

## 8. Point the mint page at the new contract

Deploying a contract does not switch the mint page to it. In `.env.local`, add or replace `NFT_CONTRACT_ADDRESS` with the **contract address** printed in step 7:

```text
NFT_CONTRACT_ADDRESS=0xYOUR_NEW_CONTRACT_ADDRESS
```

Keep the private key line from step 6. Start the page, or restart it if it is already running so it reads the new address and compiled artifact:

```bash
npm run dev
```

Open or reload [http://localhost:3000](http://localhost:3000). **Before minting**, compare the **Contract** link below the Mint button with the address printed in step 7. If they differ, correct `NFT_CONTRACT_ADDRESS`, restart `npm run dev`, and reload the page.

## 9. Connect MetaMask and mint

1. Click **Connect MetaMask** and approve the connection for your test account.
2. If prompted, approve the switch to **Base Sepolia**. Confirm that this account has Base Sepolia test ETH.
3. Leave the on-chain counter at `1` to mint one NFT. The `+` and `−` buttons change the shared counter from 1 to 10; **each click sends a separate transaction and costs test gas**.
4. Click **Mint**, review the contract address and transaction in MetaMask, and confirm. The page shows a BaseScan transaction link. Wait for confirmation.

Every NFT minted from this `MyNFT` deployment uses the same JSON link in `TOKEN_URI`. If the image does not appear in a wallet immediately, open the JSON link and its `image` link directly to check the metadata. Wallets and marketplaces may take time to refresh images.

## Quick checks

| Problem | Check |
| --- | --- |
| JSON link shows the image or a dashboard page | Copy the **JSON file's** public gateway link from the second Pinata upload. |
| Page says the workshop contract is unavailable | Run `npm run compile:contract`, check `NFT_CONTRACT_ADDRESS`, and restart `npm run dev`. Use the `deploy:mynft` command above for a contract the page can recognize. |
| Deployment or mint fails for insufficient funds | Fund the same test wallet with **Base Sepolia ETH**. |
| A new mint shows the old art | Compare the mint transaction’s **To** address on BaseScan with the address printed during deployment. If they differ, repeat step 8 before minting again. If they match, check the `image` field in the new metadata JSON. |

References: [Pinata file upload guide](https://pinata.cloud/blog/how-to-use-pinata-a-step-by-step-guide-for-beginners/), [Pinata NFT metadata guide](https://knowledge.pinata.cloud/en/articles/5455523-nfts-and-pinata), and [Base Sepolia chain ID](https://docs.base.org/base-chain/api-reference/ethereum-json-rpc-api/eth_chainId).
