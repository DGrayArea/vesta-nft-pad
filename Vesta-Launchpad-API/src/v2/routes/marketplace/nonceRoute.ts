import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { NonceManager } from '../../../v2/utils/web3/NonceManager';
import { validateAddress } from '../../../v2/utils/web3/address';

const router = Router();
const prisma = new PrismaClient();
const nonceManager = new NonceManager(prisma);

/**
 * @swagger
 * /api/v2/nonce/{maker}:
 *   get:
 *     summary: Get the next available nonce for a maker address
 *     tags: [Nonce Management]
 *     parameters:
 *       - name: maker
 *         in: path
 *         required: true
 *         description: The maker's Ethereum address
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved next available nonce
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nonce:
 *                   type: string
 *                   description: The next available nonce as a string
 *       400:
 *         description: Invalid maker address
 *       500:
 *         description: Server error while retrieving nonce
 */
router.get('/:maker', async (req, res) => {
    try {
        const { maker } = req.params;
        
        if (!validateAddress(maker)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid maker address format',
                code: 'INVALID_ADDRESS'
            });
        }

        const nonce = await nonceManager.getNextAvailableNonce(maker);
        
        return res.json({
            status: 'success',
            data: {
                nonce: nonce.toString()
            }
        });
    } catch (error: unknown) {
        console.error('Error getting nonce:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to get nonce',
            code: 'NONCE_RETRIEVAL_ERROR'
        });
    }
});

/**
 * @swagger
 * /api/v2/nonce/{maker}/range:
 *   get:
 *     summary: Get a range of available nonces for a maker address
 *     tags: [Nonce Management]
 *     parameters:
 *       - name: maker
 *         in: path
 *         required: true
 *         description: The maker's Ethereum address
 *         schema:
 *           type: string
 *       - name: count
 *         in: query
 *         required: true
 *         description: Number of nonces to retrieve (max 50)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Successfully retrieved nonce range
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nonces:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Array of available nonces as strings
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error while retrieving nonces
 */
router.get('/:maker/range', async (req, res) => {
    try {
        const { maker } = req.params;
        const count = parseInt(req.query.count as string, 10);

        if (!validateAddress(maker)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid maker address format',
                code: 'INVALID_ADDRESS'
            });
        }

        if (Number.isNaN(count) || count < 1) {
            return res.status(400).json({
                status: 'error',
                message: 'Count must be a positive integer',
                code: 'INVALID_COUNT'
            });
        }

        const range = await nonceManager.getNonceRange(maker, count);
        
        const nonces = Array.from(
            { length: range.count },
            (_, i) => (range.start + BigInt(i)).toString()
        );

        return res.json({
            status: 'success',
            data: {
                nonces,
                start: range.start.toString(),
                count: range.count
            }
        });
    } catch (error: unknown) {
        console.error('Error getting nonce range:', error);
        
        if (error instanceof Error && error.message?.includes('Cannot request more than')) {
            return res.status(400).json({
                status: 'error',
                message: error.message,
                code: 'EXCEEDS_MAX_NONCES'
            });
        }

        return res.status(500).json({
            status: 'error',
            message: 'Failed to get nonce range',
            code: 'NONCE_RANGE_ERROR'
        });
    }
});

/**
 * @swagger
 * /api/v2/nonce/{maker}/{nonce}/status:
 *   get:
 *     summary: Get the status of a specific nonce
 *     tags: [Nonce Management]
 *     parameters:
 *       - name: maker
 *         in: path
 *         required: true
 *         description: The maker's Ethereum address
 *         schema:
 *           type: string
 *       - name: nonce
 *         in: path
 *         required: true
 *         description: The nonce to check
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved nonce status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [RESERVED, USED]
 *                   description: Current status of the nonce
 *                 listingId:
 *                   type: string
 *                   description: Associated listing ID if status is USED
 *       404:
 *         description: Nonce not found
 *       500:
 *         description: Server error while retrieving status
 */
router.get('/:maker/:nonce/status', async (req, res) => {
    try {
        const { maker, nonce } = req.params;

        if (!validateAddress(maker)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid maker address format',
                code: 'INVALID_ADDRESS'
            });
        }

        const nonceRecord = await prisma.nonceTracking.findUnique({
            where: {
                makerAddress_nonce: {
                    makerAddress: maker,
                    nonce: BigInt(nonce)
                }
            },
            select: {
                status: true,
                listingId: true,
                createdAt: true
            }
        });

        if (!nonceRecord) {
            return res.status(404).json({
                status: 'error',
                message: 'Nonce not found',
                code: 'NONCE_NOT_FOUND'
            });
        }

        return res.json({
            status: 'success',
            data: nonceRecord
        });
    } catch (error: unknown) {
        console.error('Error getting nonce status:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to get nonce status',
            code: 'NONCE_STATUS_ERROR'
        });
    }
});

/**
 * @swagger
 * /api/v2/nonce/{maker}/{nonce}/use:
 *   post:
 *     summary: Mark a nonce as used
 *     tags: [Nonce Management]
 *     parameters:
 *       - name: maker
 *         in: path
 *         required: true
 *         description: The maker's Ethereum address
 *         schema:
 *           type: string
 *       - name: nonce
 *         in: path
 *         required: true
 *         description: The nonce to mark as used
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listingId:
 *                 type: string
 *                 description: The listing ID associated with this nonce
 *     responses:
 *       200:
 *         description: Successfully marked nonce as used
 *       400:
 *         description: Invalid parameters or nonce already used
 *       500:
 *         description: Server error while updating nonce
 */
router.post('/:maker/:nonce/use', async (req, res) => {
    try {
        const { maker, nonce } = req.params;
        const { listingId } = req.body;

        if (!validateAddress(maker)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid maker address format',
                code: 'INVALID_ADDRESS'
            });
        }

        if (!listingId) {
            return res.status(400).json({
                status: 'error',
                message: 'Listing ID is required',
                code: 'MISSING_LISTING_ID'
            });
        }

        await nonceManager.markNonceAsUsed(maker, BigInt(nonce), listingId);

        return res.json({
            status: 'success',
            message: 'Nonce marked as used',
            data: {
                makerAddress: maker,
                nonce,
                listingId
            }
        });
    } catch (error: unknown) {
        console.error('Error marking nonce as used:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to mark nonce as used',
            code: 'NONCE_UPDATE_ERROR'
        });
    }
});

export default router;
