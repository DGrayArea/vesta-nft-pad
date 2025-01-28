import { OrderController } from "@/v2/controllers/marketplace/orderController";
import express from "express";

const router = express.Router();
const orderController = new OrderController();

/**
 * @swagger
 * /api/v2/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listing:
 *                 type: object
 *                 description: Details of the listing for the order
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: ID of the listing
 *                   maker:
 *                     type: string
 *                     description: Maker address of the listing
 *                   nftContract:
 *                     type: string
 *                     description: NFT contract address
 *                   tokenId:
 *                     type: integer
 *                     description: Token ID of the NFT
 *                   quantity:
 *                     type: integer
 *                     description: Quantity of the NFT
 *                   price:
 *                     type: number
 *                     description: Price of the listing
 *                   status:
 *                     type: string
 *                     description: Status of the listing
 *                     enum:
 *                       - pending
 *                       - executed
 *                       - cancelled
 *                   paymentToken:
 *                     type: string
 *                     description: Payment token address
 *                   strategyId:
 *                     type: string
 *                     description: ID of the sale strategy
 *                   params:
 *                     type: object
 *                     description: Additional parameters for the listing
 *               signer:
 *                 type: string
 *                 description: Signer address of the user
 *     responses:
 *       200:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   description: The created order
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */

router.post("/", orderController.createOrder);

/**
 * @swagger
 * /api/v2/orders/execute:
 *   post:
 *     summary: Execute an existing order
 *     tags: [Orders V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order:
 *                 type: object
 *                 description: Details of the order to be executed
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: ID of the order
 *                   transactionHash:
 *                     type: string
 *                     description: Transaction hash of the order (optional)
 *                   orderHash:
 *                     type: string
 *                     description: Hash of the order
 *                   maker:
 *                     type: string
 *                     description: Maker address of the order
 *                   taker:
 *                     type: string
 *                     description: Taker address of the order (optional)
 *                   expiry:
 *                     type: string
 *                     format: date-time
 *                     description: Expiry date and time of the order
 *                   nonce:
 *                     type: integer
 *                     description: Nonce of the order
 *                   signature:
 *                     type: string
 *                     description: Signature of the order
 *                   status:
 *                     type: string
 *                     description: Status of the order
 *                     enum:
 *                       - pending
 *                       - executed
 *                       - cancelled
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Date and time the order was created
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     description: Date and time the order was last updated
 *               signature:
 *                 type: string
 *                 description: Signature for order verification
 *     responses:
 *       200:
 *         description: Order executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   description: The executed order details
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 *
 */

router.post("/execute", orderController.executeOrder);

/**
 * @swagger
 * /api/v2/orders/{orderHash}:
 *   get:
 *     summary: Retrieve an order by its hash
 *     tags: [Orders V2]
 *     parameters:
 *       - in: path
 *         name: orderHash
 *         required: true
 *         schema:
 *           type: string
 *         description: The hash of the order
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */

router.get("/:orderHash", orderController.getOrder);

/**
 * @swagger
 * /api/v2/orders:
 *   get:
 *     summary: Retrieve orders based on filters with pagination
 *     tags: [Orders V2]
 *     parameters:
 *       - in: query
 *         name: filters
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               description: Filter orders by status (pending,executed,cancelled)
 *             page:
 *               type: integer
 *               description: Page number for pagination
 *             limit:
 *               type: integer
 *               description: Number of items per page
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       500:
 *         description: Server error
 */

router.get("/", orderController.getOrders);

/**
 * @swagger
 * /api/v2/orders/{orderHash}/cancel:
 *   put:
 *     summary: Cancel an order by its hash
 *     tags: [Orders V2]
 *     parameters:
 *       - in: path
 *         name: orderHash
 *         required: true
 *         schema:
 *           type: string
 *         description: The hash of the order
 *       - in: body
 *         name: maker
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             maker:
 *               type: string
 *               description: The maker of the order
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Failed to cancel order
 */

router.put("/:orderHash/cancel", orderController.cancelOrder);

export default router;
