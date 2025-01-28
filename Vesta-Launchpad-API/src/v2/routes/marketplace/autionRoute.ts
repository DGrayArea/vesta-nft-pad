import { AuctionController } from "@/v2/controllers/marketplace/autionController";
import express from "express";

const router = express.Router();
const auctionController = new AuctionController();

/**
 * @swagger
 * /api/v2/auctions:
 *   post:
 *     summary: Create a new auction
 *     tags: [Auctions V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               auctionId:
 *                 type: string
 *                 description: The starting bid for the auction (as a string for precision)
 *               seller:
 *                 type: string
 *                 description: The address of the seller of the auctioned item
 *               highestBidder:
 *                 type: string
 *                 description: The address of the highest bidder (optional)
 *               highestBid:
 *                 type: string
 *                 description: The highest bid amount (optional)
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: The start date and time for the auction
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: The end date and time for the auction
 *               minBidIncrement:
 *                 type: string
 *                 description: The minimum bid increment allowed for the auction (as a string for precision)
 *               reservePrice:
 *                 type: string
 *                 description: The reserve price for the auction (as a string for precision)
 *               nftContract:
 *                 type: string
 *                 description: The NFT contract address associated with the auction
 *               tokenId:
 *                 type: integer
 *                 description: The unique token ID of the item being auctioned
 *               paymentToken:
 *                 type: string
 *                 description: The token to be used for payments in the auction
 *               quantity:
 *                 type: integer
 *                 description: The number of items being auctioned

 *     responses:
 *       201:
 *         description: Auction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 auctionId:
 *                   type: string
 *                   description: The ID of the created auction
 *                 seller:
 *                   type: string
 *                   description: The address of the seller
 *                 startTime:
 *                   type: string
 *                   format: date-time
 *                   description: The start time of the auction
 *                 endTime:
 *                   type: string
 *                   format: date-time
 *                   description: The end time of the auction
 *                 reservePrice:
 *                   type: string
 *                   description: The reserve price for the auction
 *                 nftContract:
 *                   type: string
 *                   description: The NFT contract address associated with the auction
 *                 tokenId:
 *                   type: integer
 *                   description: The token ID of the auctioned item
 *                 quantity:
 *                   type: integer
 *                   description: The number of items being auctioned
 *       400:
 *         description: Bad request (invalid input)
 *       500:
 *         description: Server error
 */

router.post("/", auctionController.createAuction);

/**
 * @swagger
 * /api/v2/auctions:
 *   get:
 *     summary: Retrieve a list of all auctions with optional filters and pagination
 *     tags: [Auctions V2]
 *     parameters:
 *       - in: query
 *         name: maker
 *         required: false
 *         schema:
 *           type: string
 *         description: The maker (seller) of the auction items.
 *       - in: query
 *         name: nftContract
 *         required: false
 *         schema:
 *           type: string
 *         description: The strategy ID for filtering auctions.
 *       - in: query
 *         name: minPrice
 *         required: false
 *         schema:
 *           type: string
 *         description: The minimum price for filtering auctions.
 *       - in: query
 *         name: maxPrice
 *         required: false
 *         schema:
 *           type: string
 *         description: The maximum price for filtering auctions.
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination (default is 1).
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of auctions per page (default is 10).
 *     responses:
 *       200:
 *         description: A list of auctions based on the provided filters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 auctions:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: The total number of auctions matching the filters.
 *                     pages:
 *                       type: integer
 *                       description: The total number of pages available.
 *                     currentPage:
 *                       type: integer
 *                       description: The current page number.
 *       500:
 *         description: Server error
 */

router.get("/", auctionController.getAuctions);

/**
 * @swagger
 * /api/v2/auctions/{id}:
 *   get:
 *     summary: Get an auction by its ID
 *     tags: [Auctions V2]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the auction to retrieve
 *     responses:
 *       200:
 *         description: Auction details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The ID of the auction
 *                 highestBid:
 *                   type: number
 *                   format: float
 *                   description: The highest bid currently in the auction
 *                 highestBidder:
 *                   type: string
 *                   description: The identifier of the highest bidder
 *       404:
 *         description: Auction not found
 *       500:
 *         description: Server error
 */

router.get("/:id", auctionController.getAuction);

/**
 * @swagger
 * /api/v2/auctions/bid/{id}:
 *   post:
 *     summary: Place a bid on an auction
 *     tags: [Auctions V2]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the auction to place a bid on
 *       - in: body
 *         name: bid
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             bidder:
 *               type: string
 *               description: The identifier (e.g., user ID) of the bidder
 *             amount:
 *               type: string
 *               description: The bid amount placed by the bidder. Must be greater than the highest bid and meet the minimum increment.
 *     responses:
 *       200:
 *         description: Bid placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The auction ID
 *                 highestBidder:
 *                   type: string
 *                   description: The user ID of the highest bidder
 *                 highestBid:
 *                   type: string
 *                   description: The amount of the highest bid placed in the auction
 *       400:
 *         description: Invalid bid amount, auction not active, or bid amount too low
 *       404:
 *         description: Auction not found
 *       500:
 *         description: Server error
 */

router.post("/bid/:id", auctionController.placeBid);

/**
 * @swagger
 * /api/v2/auctions/settle/{id}:
 *   put:
 *     summary: Settle an auction once it's ended
 *     tags: [Auctions V2]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the auction to settle
 *       - in: body
 *         name: seller
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             seller:
 *               type: string
 *               description: The seller's address (for authorization)
 *     responses:
 *       200:
 *         description: Auction settled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The auction ID
 *                 settled:
 *                   type: boolean
 *                   description: Whether the auction has been settled
 *       400:
 *         description: Invalid auction status or auction not ended
 *       403:
 *         description: Unauthorized seller
 *       404:
 *         description: Auction not found
 *       500:
 *         description: Server error, failed to settle auction
 */

router.post("/settle/:id", auctionController.settleAuction);

export default router;
