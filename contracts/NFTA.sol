// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MyNFT is ERC721URIStorage {
    uint256 public tokenId;
    uint public counter = 1;
    string private constant TOKEN_URI = "https://ivory-additional-snail-831.mypinata.cloud/ipfs/bafkreibc7d3vnc24vsg3inh6s6qh6d2xlfhd62fexxt3n5pxtuoshsk7be";

    constructor() ERC721("Sherwaskjdakjsdinz", "SHER") {}

    function mint() external {
        _mintOne();
    }

    function mint(uint256 quantity) external {
        require(quantity >= 1 && quantity <= 10, "Quantity must be 1 to 10");
        for (uint256 i = 0; i < quantity; i++) {
            _mintOne();
        }
    }

    function increment() external {
        require(counter < 10, "Counter is already ten");
        counter++;
    }

    function decrement() external {
        require(counter > 1, "Counter is already one");
        counter--;
    }

    function _mintOne() private {
        uint256 id = tokenId++;
        _safeMint(msg.sender, id);
        _setTokenURI(id, TOKEN_URI);
    }
}
