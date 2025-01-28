import { PrismaClient } from "@prisma/client";
import {
  TAuctionCreateInput,
  TAuctionFilters,
  TBidInput,
} from "@/v2/types/marketplace/auctions";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/v2/helper/api-errors";

const prisma = new PrismaClient();

export class AuctionService {
  /**
   * Creates a new auction.
   * @param data - The auction data to create.
   * @returns The created auction including bids.
   * @throws MarketplaceError if the auction creation fails.
   */
  async createAuction(data: TAuctionCreateInput): Promise<any> {
    const isAuction = await prisma.auctionV2.findUnique({
      where: { auctionId: data.auctionId },
    });

    if (!isAuction) {
      throw new NotFoundError("Auction not found");
    }

    const auction = await prisma.auctionV2.create({
      data: {
        auctionId: data.auctionId,
        seller: data.seller,
        startTime: data.startTime,
        endTime: data.endTime,
        minBidIncrement: data.minBidIncrement,
        reservePrice: data.reservePrice,
        paymentToken: data.paymentToken,
        nftContract: data.nftContract,
        tokenId: data.tokenId,
        quantity: data.quantity,
      },
    });
    return auction;
  }

  /**
   * Retrieves auctions based on provided filters.
   * @param filters - The filters to apply to the auction search.
   * @returns A paginated list of auctions and total count.
   * @throws MarketplaceError if fetching auctions fails.
   */
  async getAuctions(filters: TAuctionFilters) {
    const where: any = {};

    if (filters.seller) where.seller = filters.seller;
    if (filters.nftContract) where.nftContract = filters.nftContract;
    if (filters.tokenId) where.tokenId = filters.tokenId;

    const [auctions, totalCount] = await prisma.$transaction([
      prisma.auctionV2.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auctionV2.count({ where }),
    ]);

    if (auctions.length <= 0 || !auctions) {
      throw new NotFoundError("No auctions found for the specified filters");
    }

    return {
      auctions,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / filters.limit),
        currentPage: filters.page,
      },
    };
  }

  /**
   * Retrieves a specific auction by ID.
   * @param id - The ID of the auction to retrieve.
   * @returns The auction with bids.
   * @throws MarketplaceError if the auction is not found.
   */
  async getAuction(id: string): Promise<any> {
    const auction = await prisma.auctionV2.findUnique({
      where: { id },
    });

    if (!auction) {
      throw new NotFoundError("Auction not found");
    }

    return auction;
  }

  /**
   * Places a bid on an auction.
   * @param id - The ID of the auction to bid on.
   * @param data - The bid data including amount and bidder address.
   * @returns The updated auction with all bids.
   * @throws MarketplaceError if the bid is invalid or auction is not active.
   */
  async placeBid(id: string, data: TBidInput): Promise<any> {
    const auction = await prisma.auctionV2.findUnique({ where: { id } });

    if (!auction) {
      throw new NotFoundError("Auction not found");
    }

    if (new Date() > auction.endTime || auction.settled) {
      throw new BadRequestError("Auction is not active");
    }

    const newBidAmount = BigInt(data.amount);
    const highestBid = BigInt(auction.highestBid ?? "0");
    const minIncrement = BigInt(auction.minBidIncrement);

    if (
      newBidAmount <= highestBid ||
      newBidAmount < highestBid + minIncrement
    ) {
      throw new BadRequestError("Bid amount is too low");
    }

    const updatedAuction = await prisma.auctionV2.update({
      where: { id },
      data: {
        highestBidder: data.bidder,
        highestBid: data.amount,
      },
    });

    return updatedAuction;
  }

  /**
   * Settles an ended auction.
   * @param id - The ID of the auction to settle.
   * @param seller - The seller's address for authorization.
   * @returns The settled auction with all bids.
   * @throws MarketplaceError if the auction cannot be settled.
   */
  async settleAuction(id: string, seller: string): Promise<any> {
      const auction = await prisma.auctionV2.findUnique({
        where: { id },
      });

      if (!auction) {
        throw new NotFoundError("Auction not found");
      }

      if (auction.seller !== seller) {
        throw new ForbiddenError("Unauthorized seller");
      }

      if (auction.settled) {
        throw new BadRequestError("Auction already settled");
      }

      if (new Date() < auction.endTime) {
        throw new BadRequestError("Auction has not ended yet");
      }

      const settledAuction = await prisma.auctionV2.update({
        where: { id },
        data: { settled: true },
      });

      return settledAuction;
  }
}
