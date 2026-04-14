// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title AgentMarketplace
 * @notice Escrow-based marketplace for buying/selling AIsphere Agent INFTs
 * @dev Seller lists agent → buyer pays A0GI → contract transfers INFT + releases funds
 */
contract AgentMarketplace is ReentrancyGuard {

    // ==================== Data Structures ====================

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;       // price in wei
        bool active;
        uint256 listedAt;
    }

    // ==================== State ====================

    IERC721 public immutable inftContract;
    address public owner;
    uint256 public feePercentage;  // basis points (e.g. 250 = 2.5%)
    uint256 public constant MAX_FEE = 500; // max 5%

    uint256 private _nextListingId;
    mapping(uint256 => Listing) public listings;        // listingId → Listing
    mapping(uint256 => uint256) public tokenToListing;  // tokenId → listingId (0 = not listed)

    uint256 public totalVolume;
    uint256 public totalSales;

    // ==================== Events ====================

    event AgentListed(uint256 indexed listingId, uint256 indexed tokenId, address indexed seller, uint256 price);
    event AgentSold(uint256 indexed listingId, uint256 indexed tokenId, address buyer, address seller, uint256 price);
    event ListingCancelled(uint256 indexed listingId, uint256 indexed tokenId);
    event FeeUpdated(uint256 newFee);

    // ==================== Modifiers ====================

    modifier onlyOwner() {
        require(msg.sender == owner, "Marketplace: not owner");
        _;
    }

    // ==================== Constructor ====================

    constructor(address _inftContract) {
        inftContract = IERC721(_inftContract);
        owner = msg.sender;
        feePercentage = 250; // 2.5% default
        _nextListingId = 1;
    }

    // ==================== Core Functions ====================

    /**
     * @notice List an Agent INFT for sale. Seller must approve this contract first.
     * @param tokenId The INFT token ID to list
     * @param price Sale price in wei (must be > 0)
     */
    function listAgent(uint256 tokenId, uint256 price) external nonReentrant returns (uint256 listingId) {
        require(price > 0, "Marketplace: price must be > 0");
        require(inftContract.ownerOf(tokenId) == msg.sender, "Marketplace: not token owner");
        require(
            inftContract.getApproved(tokenId) == address(this) ||
            inftContract.isApprovedForAll(msg.sender, address(this)),
            "Marketplace: not approved"
        );
        require(tokenToListing[tokenId] == 0, "Marketplace: already listed");

        listingId = _nextListingId++;
        listings[listingId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true,
            listedAt: block.timestamp
        });
        tokenToListing[tokenId] = listingId;

        emit AgentListed(listingId, tokenId, msg.sender, price);
    }

    /**
     * @notice Buy a listed Agent INFT. Sends exact price in msg.value.
     * @param listingId The listing to purchase
     */
    function buyAgent(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Marketplace: listing not active");
        require(msg.value == listing.price, "Marketplace: incorrect payment");
        require(msg.sender != listing.seller, "Marketplace: cannot buy own listing");

        // Calculate fee
        uint256 fee = (listing.price * feePercentage) / 10000;
        uint256 sellerProceeds = listing.price - fee;

        // Update state before external calls (CEI pattern)
        listing.active = false;
        tokenToListing[listing.tokenId] = 0;
        totalVolume += listing.price;
        totalSales++;

        // Transfer INFT to buyer
        inftContract.safeTransferFrom(listing.seller, msg.sender, listing.tokenId);

        // Pay seller
        (bool success, ) = listing.seller.call{value: sellerProceeds}("");
        require(success, "Marketplace: seller payment failed");

        // Fee stays in contract (withdrawable by owner)

        emit AgentSold(listingId, listing.tokenId, msg.sender, listing.seller, listing.price);
    }

    /**
     * @notice Cancel a listing (only seller can cancel).
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Marketplace: listing not active");
        require(msg.sender == listing.seller || msg.sender == owner, "Marketplace: not authorized");

        listing.active = false;
        tokenToListing[listing.tokenId] = 0;

        emit ListingCancelled(listingId, listing.tokenId);
    }

    // ==================== Admin ====================

    function setFee(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= MAX_FEE, "Marketplace: fee too high");
        feePercentage = _feePercentage;
        emit FeeUpdated(_feePercentage);
    }

    function withdrawFees() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "Marketplace: no fees to withdraw");
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Marketplace: withdrawal failed");
    }

    // ==================== View Functions ====================

    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    function isListed(uint256 tokenId) external view returns (bool) {
        uint256 lid = tokenToListing[tokenId];
        return lid != 0 && listings[lid].active;
    }

    function getListingByToken(uint256 tokenId) external view returns (Listing memory) {
        uint256 lid = tokenToListing[tokenId];
        require(lid != 0, "Marketplace: not listed");
        return listings[lid];
    }
}
