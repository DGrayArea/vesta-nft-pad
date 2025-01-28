import prisma from "@/common/prisma-client";
import { NotFoundError } from "@/v2/helper/api-errors";
import {
  TOfferCreateInput,
  TCounterOfferInput,
  TOfferFilters,
} from "@/v2/types/marketplace/offers";
import { marketplace } from "@/v2/utils/web3";
import { ethers } from "ethers";

export class offerServices {
  /**
   * Creates a new offer for an NFT
   * @param data - The offer data to create
   * @returns The created offer
   * @throws MarketplaceError if offer creation fails
   */
  async createOffer(data: TOfferCreateInput): Promise<any> {
    // Generate unique offer ID
    const offerId = ethers.id(
      `${data.nftContract}${data.tokenId}${data.offerer}${Date.now()}`
    );

    // Get next nonce for offerer
    const nonce = await marketplace.getNonce(data.offerer);

    // Create offer document

    // const tx = await marketplace.createOffer(
    //   offerId,
    //   data.nftContract,
    //   data.tokenId,
    //   data.quantity,
    //   data.price,
    //   data.paymentToken,
    //   data.expiry
    // );

    // await tx.wait();

    const createOffer = await prisma.offerV2.create({
      data: {
        offerId,
        offerer: data.offerer,
        nftContract: data.nftContract,
        tokenId: data.tokenId,
        quantity: data.quantity,
        price: data.price,
        paymentToken: data.paymentToken,
        expiry: new Date(data.expiry * 1000),
        nonce,
      },
    });
    return createOffer;
  }

  /**
   * Creates a counter-offer for an existing offer
   * @param offerId - Original offer ID
   * @param data - Counter-offer data
   * @returns The created counter-offer
   * @throws MarketplaceError if counter-offer creation fails
   */
  async createCounterOffer(
    offerId: string,
    data: TCounterOfferInput
  ): Promise<any> {
    const originalOffer = await this.getOffer(offerId);

    // Generate counter-offer ID
    const counterOfferId = ethers.id(
      `${originalOffer.nftContract}${originalOffer.tokenId}${
        data.offerer
      }${Date.now()}`
    );

    const nonce = await marketplace.getNonce(data.offerer);
    // Create counter-offer on-chain
    // const tx = await marketplace.createCounterOffer(
    //   counterOfferId,
    //   offerId,
    //   data.price,
    //   data.expiry
    // );

    // await tx.wait();

    const createOffer = await prisma.offerV2.create({
      data: {
        offerId: counterOfferId,
        offerer: data.offerer,
        nftContract: originalOffer.nftContract,
        tokenId: originalOffer.tokenId,
        quantity: originalOffer.quantity,
        price: data.price,
        paymentToken: originalOffer.paymentToken,
        expiry: new Date(data.expiry * 1000),
        nonce,
        isCounterOffer: true,
        originalOfferId: offerId,
      },
    });

    return createOffer;
  }

  /**
   * Accepts an offer
   * @param offerId - The offer ID to accept
   * @returns The accepted offer
   * @throws MarketplaceError if acceptance fails
   */
  async acceptOffer(offerId: string): Promise<any> {
    const offer = await this.getOffer(offerId);

    if (!offer) {
      throw new NotFoundError(`Offer not found`);
    }
    // Accept offer on-chain
    // const tx = await marketplace.acceptOffer(offerId);
    // await tx.wait();

    const executeOffer = await prisma.offerV2.update({
      where: { offerId },
      data: {
        executed: true,
        updatedAt: new Date(),
      },
    });

    return executeOffer;
  }

  /**
   * Cancels an offer
   * @param offerId - The offer ID to cancel
   * @param canceller - Address of the user cancelling the offer
   * @returns The cancelled offer
   * @throws MarketplaceError if cancellation fails
   */
  async cancelOffer(offerId: string): Promise<any> {
    const offer = await this.getOffer(offerId);

    if (!offer) {
      throw new NotFoundError("Offer not foun");
    }
    // Cancel offer on-chain
    // const tx = await marketplace.cancelOffer(offerId);
    // await tx.wait();

    const cancelOffer = await prisma.offerV2.update({
      where: { offerId },
      data: {
        cancelled: true,
        updatedAt: new Date(),
      },
    });
    return cancelOffer;
  }

  /**
   * Retrieves offers based on provided filters.
   * @param filters - The filters to apply to the offer search.
   * @returns A paginated list of offers and total count.
   * @throws MarketplaceError if fetching offers fails.
   */
  async getOffers(filters: TOfferFilters) {
    const where: any = {};

    // Apply filters
    if (filters.offerId) where.offerer = filters.offerId;
    if (filters.maker) where.offerer = filters.maker;
    if (filters.nftContract) where.nftContract = filters.nftContract;
    if (filters.tokenId) where.tokenId = filters.tokenId;
    if (filters.minPrice) where.price = { gte: filters.minPrice };
    if (filters.maxPrice) {
      where.price = { ...where.price, lte: filters.maxPrice };
    }

    // Fetch offers and total count in a transaction
    const [offers, total] = await prisma.$transaction([
      prisma.offerV2.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.offerV2.count({ where }),
    ]);

    // Check if offers are found
    if (offers.length <= 0 || !offers) {
      throw new NotFoundError("No offers found for the specified filters");
    }

    return {
      offers,
      pagination: {
        total,
        pages: Math.ceil(total / filters.limit),
        currentPage: filters.page,
      },
    };
  }

  /**
   * Gets an offer by ID
   * @param offerId - The offer ID to fetch
   * @returns The offer if found
   * @throws MarketplaceError if offer not found
   */
  async getOffer(offerId: string): Promise<any> {
    const offer = await prisma.offerV2.findUnique({ where: { offerId } });

    if (!offer) {
      throw new NotFoundError("Offer not found");
    }

    return offer;
  }
}
