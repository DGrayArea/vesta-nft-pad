import { ListingController } from "@/v2/controllers/marketplace/listingController";
import express from "express";

const router = express.Router();
const listingController = new ListingController();

/**
 * @swagger
 * /api/v2/listings:
 *   get:
 *     summary: Retrieve listings based on filters
 *     tags: [Listings V2]
 *     parameters:
 *       - in: query
 *         name: maker
 *         schema:
 *           type: string
 *         description: The maker of the listing
 *       - in: query
 *         name: nftContract
 *         schema:
 *           type: string
 *         description: The NFT contract address
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: The status of the listing
 *       - in: query
 *         name: tokenId
 *         schema:
 *           type: string
 *         description: The NFT Token Id
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           format: float
 *         description: The minimum price of the listing
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           format: float
 *         description: The maximum price of the listing
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of listings per page
 *     responses:
 *       200:
 *         description: Listings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 listings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Listing details
 *                     properties:
 *                       id:
 *                         type: string
 *                       maker:
 *                         type: string
 *                       nftContract:
 *                         type: string
 *                       price:
 *                         type: number
 *                         format: float
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *       404:
 *         description: No listings found for the specified filters
 *       500:
 *         description: Failed to fetch listings
 */

router.get("/", listingController.getListings);

/**
 * @swagger
 * /api/v2/listings/{maker}:
 *   get:
 *     summary: Retrieve my listings based on filters
 *     tags: [Listings V2]
 *     parameters:
 *       - in: path
 *         name: maker
 *         required: true
 *         schema:
 *           type: string
 *         description: The maker of the listing
 *       - in: query
 *         name: nftContract
 *         schema:
 *           type: string
 *         description: The NFT contract address
 *       - in: query
 *         name: tokenId
 *         schema:
 *           type: string
 *         description: The NFT Token Id
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           format: float
 *         description: The minimum price of the listing
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           format: float
 *         description: The maximum price of the listing
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of listings per page
 *     responses:
 *       200:
 *         description: Listings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 listings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Listing details
 *                     properties:
 *                       id:
 *                         type: string
 *                       maker:
 *                         type: string
 *                       nftContract:
 *                         type: string
 *                       price:
 *                         type: number
 *                         format: float
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *       404:
 *         description: No listings found for the specified filters
 *       500:
 *         description: Failed to fetch listings
 */

router.get("/:maker", listingController.getMyListings);

/**
 * @swagger
 * /api/v2/listings/{contract}:
 *   get:
 *     summary: Retrieve my listings based on filters
 *     tags: [Listings V2]
 *     parameters:
 *       - in: path
 *         name: contract
 *         required: true
 *         schema:
 *           type: string
 *         description: The contract address
 *       - in: query
 *         name: maker
 *         schema:
 *           type: string
 *         description: The maker of the listing
 *       - in: query
 *         name: tokenId
 *         schema:
 *           type: string
 *         description: The NFT Token Id
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           format: float
 *         description: The minimum price of the listing
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           format: float
 *         description: The maximum price of the listing
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of listings per page
 *     responses:
 *       200:
 *         description: Listings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 listings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Listing details
 *                     properties:
 *                       id:
 *                         type: string
 *                       maker:
 *                         type: string
 *                       nftContract:
 *                         type: string
 *                       price:
 *                         type: number
 *                         format: float
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *       404:
 *         description: No listings found for the specified filters
 *       500:
 *         description: Failed to fetch listings
 */

router.get("/:contract", listingController.getListingsByContract);

/**
 * @swagger
 * /api/v2/listings/{id}:
 *   get:
 *     summary: Get a specific listing by ID
 *     tags: [Listings V2]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the listing
 *     responses:
 *       200:
 *         description: The listing details
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Failed to fetch listing
 */

router.get("/:id", listingController.getListing);

/**
 * @swagger
 * /api/v2/listings/{contract}/{tokenId}:
 *   get:
 *     summary: Get a specific listing by ID
 *     tags: [Listings V2]
 *     parameters:
 *       - in: path
 *         name: contract
 *         required: true
 *         schema:
 *           type: string
 *         description: nft contract address
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: nft tokenId
 *     responses:
 *       200:
 *         description: The listing details
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Failed to fetch listing
 */

router.get("/:contract/:tokenId", listingController.getCurrentActiveListing);

/**
 * @swagger
 * /api/v2/listings:
 *   post:
 *     summary: Create a new listing
 *     tags: [Listings V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nftContract:
 *                 type: string
 *                 description: The NFT contract address
 *               tokenId:
 *                 type: string
 *                 description: The unique identifier for the token
 *               taker:
 *                 type: string
 *                 description: The taker of the listing (buyer addres)
 *               maker:
 *                 type: string
 *                 description: The maker of the listing (seller address)
 *               quantity:
 *                 type: integer
 *                 description: The quantity of the item being listed
 *               price:
 *                 type: number
 *                 format: float
 *                 description: The price of the listing
 *               paymentToken:
 *                 type: string
 *                 description: The payment token for the listing
 *               strategyId:
 *                 type: string
 *                 description: The strategy ID for the listing
 *               nonce:
 *                 type: string
 *                 description: The nonce for the listing
 *               orderHash:
 *                 type: string
 *                 description: orderHash for the listing
 *               signature:
 *                 type: string
 *                 description: signature for the listing
 *               params:
 *                 type: object
 *                 description: Additional parameters for the listing
 *               metadata:
 *                 type: object
 *                 description: Metadata associated with the listing
 *     responses:
 *       200:
 *         description: The newly created listing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 nftContract:
 *                   type: string
 *                 tokenId:
 *                   type: string
 *                 maker:
 *                   type: string
 *                 quantity:
 *                   type: integer
 *                 price:
 *                   type: number
 *                 paymentToken:
 *                   type: string
 *                 strategyId:
 *                   type: string
 *                 params:
 *                   type: object
 *                 metadata:
 *                   type: object
 *                 status:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Listing already exists
 *       500:
 *         description: Failed to create listing
 */

router.post("/", listingController.createListing);

/**
 * @swagger
 * /api/v2/listings/{id}:
 *   put:
 *     summary: Update an existing listing by ID
 *     tags: [Listings V2]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the listing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nftContract:
 *                 type: string
 *                 description: The NFT contract address
 *               tokenId:
 *                 type: string
 *                 description: The unique identifier for the token
 *               quantity:
 *                 type: integer
 *                 description: The quantity of the item being listed
 *               price:
 *                 type: number
 *                 format: float
 *                 description: The price of the listing
 *               paymentToken:
 *                 type: string
 *                 description: The payment token for the listing
 *               strategyId:
 *                 type: string
 *                 description: The strategy ID for the listing
 *               params:
 *                 type: object
 *                 description: Additional parameters for the listing
 *               metadata:
 *                 type: object
 *                 description: Metadata associated with the listing
 *     responses:
 *       200:
 *         description: The updated listing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 nftContract:
 *                   type: string
 *                 tokenId:
 *                   type: string
 *                 quantity:
 *                   type: integer
 *                 price:
 *                   type: number
 *                 paymentToken:
 *                   type: string
 *                 strategyId:
 *                   type: string
 *                 params:
 *                   type: object
 *                 metadata:
 *                   type: object
 *                 status:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       orderId:
 *                         type: string
 *                       status:
 *                         type: string
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Failed to update listing
 */

router.put("/:id", listingController.updateListing);

/**
 * @swagger
 * /api/v2/listings/{id}/cancel:
 *   put:
 *     summary: Cancel a listing by ID
 *     tags: [Listings V2]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the listing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maker:
 *                 type: string
 *                 description: The maker of the listing (seller address)
 *     responses:
 *       200:
 *         description: The cancelled listing
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Failed to cancel listing
 */

router.put("/:id/cancel", listingController.cancelListing);

/**
 * @swagger
 * /api/v2/listings/{contract}/{tokenId}/cancel:
 *   put:
 *     summary: Cancel a listing by ID
 *     tags: [Listings V2]
 *     parameters:
 *       - in: path
 *         name: contract
 *         required: true
 *         schema:
 *           type: string
 *         description: contract address of the nft collection
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: token id of the nft collection
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maker:
 *                 type: string
 *                 description: The maker of the listing (seller address)
 *     responses:
 *       200:
 *         description: The cancelled listing
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Failed to cancel listing
 */

router.put(
  "/:contract/:tokenId/cancel",
  listingController.cancelListingByTokenID
);

/**
 * @swagger
 * /api/v2/listings/{contract}/{tokenId}/buy:
 *   put:
 *     summary: Buy a listing by ID
 *     tags: [Listings V2]
 *     parameters:
 *       - in: path
 *         name: contract
 *         required: true
 *         schema:
 *           type: string
 *         description: contract address of the nft collection
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: token id of the nft collection
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maker:
 *                 type: string
 *                 description: The maker of the listing (seller address)
 *     responses:
 *       200:
 *         description: The nft Buy
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Failed to Buy nft
 */
router.put("/:contract/:tokenId/buy", listingController.updateSold);

export default router;
