import { NftController } from "@/v2/controllers/marketplace/nftController";
import express from "express";

const router = express.Router();
const nftController = new NftController();

/**
 * @swagger
 * /api/v2/nfts/{contract}:
 *   get:
 *     summary: Retrieve NFTs for a collection by contract address with optional filters
 *     tags: [NFTs V2]
 *     parameters:
 *       - in: path
 *         name: contract
 *         required: true
 *         schema:
 *           type: string
 *         description: The contract address of the NFT collection
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, listed, unlisted]
 *           default: all
 *         description: Filter NFTs by their listing status (all, listed, unlisted)
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
 *         description: The number of NFTs per page
 *     responses:
 *       200:
 *         description: NFTs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 collection:
 *                   type: object
 *                   description: Collection details
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     contractAddress:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 nfts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tokenId:
 *                         type: string
 *                       metadata:
 *                         type: object
 *                         description: Metadata of the NFT
 *                       listing:
 *                         type: object
 *                         description: Listing details if the NFT is listed
 *                         properties:
 *                           id:
 *                             type: string
 *                           price:
 *                             type: number
 *                             format: float
 *                           status:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       404:
 *         description: Collection or NFTs not found
 *       500:
 *         description: Failed to fetch NFTs
 */

router.get("/:contract", nftController.getNFTsByCollection);

/**
 * @swagger
 * /api/v2/nfts/{contract}/{tokenId}:
 *   get:
 *     summary: Retrieve NFT details by contract address and token ID
 *     tags: [NFTs V2]
 *     parameters:
 *       - in: path
 *         name: contract
 *         required: true
 *         schema:
 *           type: string
 *         description: The contract address of the NFT collection
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: The token ID of the NFT
 *     responses:
 *       200:
 *         description: NFT details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokenId:
 *                       type: string
 *                       description: The unique token ID of the NFT
 *                     contractAddress:
 *                       type: string
 *                       description: The contract address of the NFT collection
 *                     metadata:
 *                       type: object
 *                       description: Metadata associated with the NFT
 *                     isListed:
 *                       type: boolean
 *                       description: Whether the NFT is currently listed for sale
 *                     listingId:
 *                       type: string
 *                       nullable: true
 *                       description: The ID of the listing if the NFT is listed
 *                     listing:
 *                       type: object
 *                       nullable: true
 *                       description: Full listing details if the NFT is listed
 *                 message:
 *                   type: string
 *                   example: "NFT retrieved successfully"
 *       404:
 *         description: NFT not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "NFT not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get("/:contract/:tokenId", nftController.getNftByTokenId);

/**
 * @swagger
 * /api/v2/nfts/my/owned/{address}:
 *   get:
 *     summary: Retrieve NFTs owned by a specific account with optional filters and pagination
 *     tags: [NFTs V2]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: The account address of owner you want to get owned nft
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, listed, unlisted]
 *           default: all
 *         description: Filter NFTs by their listing status (all, listed, unlisted)
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
 *         description: The number of NFTs per page
 *     responses:
 *       200:
 *         description: NFTs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nfts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       contractAddress:
 *                         type: string
 *                         description: The contract address of the NFT collection
 *                       tokenId:
 *                         type: string
 *                         description: The unique token ID of the NFT
 *                       metadata:
 *                         type: object
 *                         description: Metadata associated with the NFT
 *                       status:
 *                         type: string
 *                         enum: [listed, unlisted]
 *                         description: The listing status of the NFT
 *                       listingId:
 *                         type: string
 *                         description: The ID of the listing if the NFT is listed
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of NFTs
 *                     pages:
 *                       type: integer
 *                       description: Total number of pages available
 *                     currentPage:
 *                       type: integer
 *                       description: The current page being viewed
 *                     limit:
 *                       type: integer
 *       404:
 *         description: NFTs or collections not found for the specified account
 *       500:
 *         description: Failed to fetch NFTs due to an internal error
 */

router.get("/my/owned/:address", nftController.getMyOwnedNfts);

/**
 * @swagger
 * /api/v2/nfts/browse/listes/nft:
 *   get:
 *     summary: Retrieve all listed NFTs with optional pagination filters
 *     tags: [NFTs V2]
 *     parameters:
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
 *         description: The number of NFTs per page
 *     responses:
 *       200:
 *         description: NFTs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nfts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tokenId:
 *                         type: string
 *                       metadata:
 *                         type: object
 *                         description: Metadata of the NFT
 *                       listing:
 *                         type: object
 *                         description: Listing details of the NFT
 *                         properties:
 *                           id:
 *                             type: string
 *                           price:
 *                             type: number
 *                             format: float
 *                           status:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of listed NFTs
 *                     pages:
 *                       type: integer
 *                       description: Total number of pages available based on the `limit`
 *                     currentPage:
 *                       type: integer
 *                       description: The current page being viewed
 *                     limit:
 *                       type: integer
 *                       description: The limit (number of NFTs per page)
 *       404:
 *         description: No listed NFTs found
 *       500:
 *         description: Failed to fetch NFTs due to an internal error
 */

router.get("/browse/listes/nft", nftController.getAllListedNfts);

export default router;
