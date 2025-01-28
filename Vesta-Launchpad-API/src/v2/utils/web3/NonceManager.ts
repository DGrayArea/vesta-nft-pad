import { PrismaClient } from '@prisma/client';

interface NonceRange {
    start: bigint;
    count: number;
}

export class NonceManager {
    private prisma: PrismaClient;
    private readonly MAX_NONCE_REQUEST = 50;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async getNextAvailableNonce(makerAddress: string): Promise<bigint> {
        return await this.prisma.$transaction(async (prisma) => {
            // Get the highest used/reserved nonce for this maker
            const result = await prisma.nonceTracking.findFirst({
                where: {
                    makerAddress: makerAddress,
                },
                orderBy: {
                    nonce: 'desc',
                },
                select: {
                    nonce: true,
                },
            });

            const nextNonce = result ? result.nonce + BigInt(1) : BigInt(0);

            // Reserve the nonce
            await this.reserveNonce(makerAddress, nextNonce, prisma);

            return nextNonce;
        });
    }

    async getNonceRange(makerAddress: string, count: number): Promise<NonceRange> {
        if (count > this.MAX_NONCE_REQUEST) {
            throw new Error(`Cannot request more than ${this.MAX_NONCE_REQUEST} nonces at once`);
        }

        return await this.prisma.$transaction(async (prisma) => {
            const startNonce = await this.getNextAvailableNonce(makerAddress);

            // Reserve the range of nonces
            const promises = Array.from({ length: count }, (_, i) =>
                this.reserveNonce(makerAddress, startNonce + BigInt(i), prisma)
            );

            await Promise.all(promises);

            return {
                start: startNonce,
                count
            };
        });
    }

    private async reserveNonce(
        makerAddress: string,
        nonce: bigint,
        prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
    ): Promise<void> {
        await prisma.nonceTracking.create({
            data: {
                makerAddress,
                nonce,
                status: 'RESERVED'
            },
        });
    }

    async markNonceAsUsed(
        makerAddress: string,
        nonce: bigint,
        listingId: string
    ): Promise<void> {
        await this.prisma.nonceTracking.update({
            where: {
                makerAddress_nonce: {
                    makerAddress,
                    nonce
                }
            },
            data: {
                status: 'USED',
                listingId
            },
        });
    }
}