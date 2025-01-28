import { OfferController } from "@/v2/controllers/marketplace/offerController";
import express from "express";

const router = express.Router();
const offerController = new OfferController();

/**
 * @swagger
 * /api/v2/offers/{offerId}:
 *   get:
 *     summary: Get an offer by its ID
 *     tags: [Offers V2]
 *     parameters:
 *       - name: offerId
 *         in: path
 *         required: true
 *         description: The unique identifier for the offer
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The offer details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A success message
 *                 offer:
 *                   type: object
 *                   description: The offer details
 *                   properties:
 *                     offerId:
 *                       type: string
 *                       description: The offer ID
 *                     nftContract:
 *                       type: string
 *                       description: The NFT contract address
 *                     tokenId:
 *                       type: string
 *                       description: The unique identifier for the token
 *                     maker:
 *                       type: string
 *                       description: The maker of the offer
 *                     quantity:
 *                       type: integer
 *                       description: The quantity of the item being offered
 *                     price:
 *                       type: number
 *                       format: float
 *                       description: The price of the offer
 *                     paymentToken:
 *                       type: string
 *                       description: The payment token for the offer
 *                     strategyId:
 *                       type: string
 *                       description: The strategy ID for the offer
 *                     params:
 *                       type: object
 *                       description: Additional parameters associated with the offer
 *                     metadata:
 *                       type: object
 *                       description: Metadata associated with the offer
 *       404:
 *         description: Offer not found
 *       500:
 *         description: Failed to retrieve offer
 */

router.get("/:offerId", offerController.getOffer);

/**
 * @swagger
 * /api/v2/offers:
 *   post:
 *     summary: Create a new offer for an NFT
 *     tags: [Offers V2]
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
 *               offerer:
 *                 type: string
 *                 description: The offerer (maker) of the offer
 *               quantity:
 *                 type: integer
 *                 description: The quantity of the item being offered
 *               price:
 *                 type: number
 *                 format: float
 *                 description: The price of the offer
 *               paymentToken:
 *                 type: string
 *                 description: The payment token for the offer
 *               expiry:
 *                 type: integer
 *                 description: The expiration time of the offer in Unix timestamp
 *               nonce:
 *                 type: integer
 *                 description: The nonce (unique counter) for the offerer
 *     responses:
 *       201:
 *         description: Offer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A success message
 *                 offer:
 *                   type: object
 *                   description: The created offer details
 *                   properties:
 *                     offerId:
 *                       type: string
 *                       description: The offer ID
 *                     nftContract:
 *                       type: string
 *                       description: The NFT contract address
 *                     tokenId:
 *                       type: string
 *                       description: The unique identifier for the token
 *                     offerer:
 *                       type: string
 *                       description: The offerer (maker) of the offer
 *                     quantity:
 *                       type: integer
 *                       description: The quantity of the item being offered
 *                     price:
 *                       type: number
 *                       format: float
 *                       description: The price of the offer
 *                     paymentToken:
 *                       type: string
 *                       description: The payment token for the offer
 *                     expiry:
 *                       type: integer
 *                       description: The expiration time of the offer in Unix timestamp
 *                     nonce:
 *                       type: integer
 *                       description: The nonce (unique counter) for the offerer
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Failed to create offer
 */

router.post("/", offerController.createOffer);

/**
 * @swagger
 * /api/v2/offers/{offerId}/counter:
 *   post:
 *     summary: Create a counter-offer for an existing offer
 *     tags: [Offers V2]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the original offer to counter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: number
 *                 format: float
 *                 description: The price of the counter offer
 *               expiry:
 *                 type: integer
 *                 description: The expiration time of the counter offer in Unix timestamp
 *               paymentToken:
 *                 type: string
 *                 description: The payment token for the counter offer
 *     responses:
 *       201:
 *         description: Counter offer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A success message
 *                 counterOffer:
 *                   type: object
 *                   description: The created counter offer details
 *                   properties:
 *                     offerId:
 *                       type: string
 *                       description: The counter offer ID
 *                     nftContract:
 *                       type: string
 *                       description: The NFT contract address
 *                     tokenId:
 *                       type: string
 *                       description: The unique identifier for the token
 *                     offerer:
 *                       type: string
 *                       description: The offerer (maker) of the counter offer
 *                     price:
 *                       type: number
 *                       format: float
 *                       description: The price of the counter offer
 *                     paymentToken:
 *                       type: string
 *                       description: The payment token for the counter offer
 *                     expiry:
 *                       type: integer
 *                       description: The expiration time of the counter offer in Unix timestamp
 *                     originalOfferId:
 *                       type: string
 *                       description: The ID of the original offer that this is a counter to
 *       404:
 *         description: Original offer not found
 *       500:
 *         description: Failed to create counter offer
 */

router.post("/:offerId/counter", offerController.createCounterOffer);

/**
 * @swagger
 * /api/v2/offers/{offerId}/accept:
 *   post:
 *     summary: Accept an offer by ID
 *     tags: [Offers V2]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the offer to accept
 *     responses:
 *       200:
 *         description: The offer was accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                   example: "Offer accepted successfully"
 *                 offer:
 *                   type: object
 *                   description: The accepted offer
 *                   properties:
 *                     offerId:
 *                       type: string
 *                       description: The ID of the offer
 *                     executed:
 *                       type: boolean
 *                       description: Whether the offer has been executed
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: The timestamp when the offer was updated
 *       404:
 *         description: Offer not found
 *       500:
 *         description: Failed to accept offer
 */

router.post("/:offerId/accept", offerController.acceptOffer);

/**
 * @swagger
 * /api/v2/offers/{offerId}/cancel:
 *   put:
 *     summary: Cancel an offer by ID
 *     tags: [Offers V2]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the offer to cancel
 *       - in: body
 *         name: canceller
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             canceller:
 *               type: string
 *               description: The address of the user cancelling the offer (for authorization)
 *     responses:
 *       200:
 *         description: The offer was cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                   example: "Offer cancelled successfully"
 *                 offer:
 *                   type: object
 *                   description: The cancelled offer
 *                   properties:
 *                     offerId:
 *                       type: string
 *                       description: The ID of the offer
 *                     cancelled:
 *                       type: boolean
 *                       description: Whether the offer has been cancelled
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: The timestamp when the offer was cancelled
 *       403:
 *         description: Unauthorized to cancel the offer
 *       404:
 *         description: Offer not found
 *       500:
 *         description: Failed to cancel offer
 */

router.put("/:offerId/cancel", offerController.cancelOffer);

export default router;
