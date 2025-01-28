import prisma from "@/common/prisma-client";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/v2/helper/api-errors";
import {
  TListingCreateInput,
  TListingFilters,
  TListingStatus,
} from "@/v2/types/marketplace/listing";

export class ListingService {
  /**
   * Creates a new listing.
   * @param data - The listing data to create.
   * @returns The created listing including orders.
   * @throws MarketplaceError if the listing already exists or creation fails.
   */

  async createListing(data: TListingCreateInput): Promise<any> {
    console.log("create listing :", data);
    // Check if the listing already exists with the same nftContract and tokenId
    const existingListing = await prisma.listingV2.findFirst({
      where: {
        nftContract: data.nftContract,
        tokenId: data.tokenId,
        maker: data.maker,
        status: "active" as TListingStatus,
      },
    });

    if (existingListing) {
      throw new BadRequestError(
        `Listing already exists :Listing with contract ${data.nftContract} and token ID ${data.tokenId} already exists.`
      );
    }

    const listing = await prisma.listingV2.create({
      data: {
        nftContract: data.nftContract,
        tokenId: data.tokenId,
        taker: data.taker,
        orderHash: data.orderHash,
        nonce: data.nonce,
        signature: data.signature,
        maker: data.maker,
        quantity: data.quantity,
        price: data.price,
        paymentToken: data.paymentToken,
        expiry: data.expiry,
        strategyId: data.strategyId,
        params: data.params,
        metadata: data.metadata || {},
        status: "active" as TListingStatus,
      },
      include: {
        orders: true,
      },
    });

    return listing;
  }

  /**
   * Retrieves paginated and filtered active listings by the specified contract.
   * @param contract - The address of the NFT contract.
   * @param filters - The filters to apply to the listing search.
   * @returns A paginated contract of the active listings.
   * @throws NotFoundError if no active listings are found for the contract.
   */
  async getContractListings(contract: string, filters: TListingFilters) {
    const where: any = {
      nftContract: contract,
      status: "active",
    };

    // Apply filters
    if (filters.minPrice) where.price = { gte: filters.minPrice };
    if (filters.maxPrice) {
      where.price = { ...where.price, lte: filters.maxPrice };
    }
    if (filters.maker) where.maker = filters.maker;
    if (filters.tokenId) where.tokenId = filters.tokenId;

    // Pagination logic
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const [listings, total] = await prisma.$transaction([
      prisma.listingV2.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { orders: true },
      }),
      prisma.listingV2.count({ where }),
    ]);

    if (listings.length === 0) {
      throw new NotFoundError(
        `No active listings found for nft contract ${contract}`
      );
    }

    return {
      listings,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    };
  }

  /**
   * Retrieves paginated and filtered active listings created by the specified maker.
   * @param maker - The address of the NFT maker/seller.
   * @param filters - The filters to apply to the listing search.
   * @returns A paginated list of the maker's active listings.
   * @throws NotFoundError if no active listings are found for the maker.
   */
  async getMyListings(maker: string, filters: TListingFilters) {
    const where: any = {
      maker,
      status: "active",
    };

    // Apply filters
    if (filters.minPrice) where.price = { gte: filters.minPrice };
    if (filters.maxPrice) {
      where.price = { ...where.price, lte: filters.maxPrice };
    }
    if (filters.nftContract) where.nftContract = filters.nftContract;
    if (filters.tokenId) where.tokenId = filters.tokenId;

    // Pagination logic
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const [listings, total] = await prisma.$transaction([
      prisma.listingV2.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { orders: true },
      }),
      prisma.listingV2.count({ where }),
    ]);

    if (listings.length === 0) {
      throw new NotFoundError(`No active listings found for maker ${maker}`);
    }

    return {
      listings,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    };
  }

  /**
   * Retrieves listings based on provided filters.
   * @param filters - The filters to apply to the listing search.
   * @returns A paginated list of listings and total count.
   * @throws MarketplaceError if fetching listings fails.
   */

  async getListings(filters: TListingFilters) {
    const where: any = {};

    if (filters.maker) where.maker = filters.maker;
    if (filters.nftContract) where.nftContract = filters.nftContract;
    if (filters.status) where.status = filters.status;
    if (filters.strategyId) where.strategyId = filters.strategyId;
    if (filters.minPrice) where.price = { gte: filters.minPrice };
    if (filters.maxPrice) {
      where.price = { ...where.price, lte: filters.maxPrice };
    }

    const [listings, total] = await prisma.$transaction([
      prisma.listingV2.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { createdAt: "desc" },
        include: { orders: true },
      }),
      prisma.listing.count({ where }),
    ]);

    if (listings.length < 0 || !listings) {
      throw new NotFoundError("No listings found for the specified filters");
    }

    return {
      listings,
      pagination: {
        total,
        pages: Math.ceil(total / filters.limit),
        currentPage: filters.page,
        limit: filters.limit,
      },
    };
  }

  /**
   * Retrieves a specific active listing valid up to and including expiry time.
   * @param id - The ID of the listing to retrieve.
   * @returns The listing with orders.
   * @throws MarketplaceError if the listing is not found.
   */

  async getCurrentActiveListing(
    nftContract: string,
    tokenId: string
  ): Promise<any> {
    const currentTimestamp = Math.floor(Date.now() / 1000).toString();

    const listing = await prisma.listingV2.findFirst({
      where: {
        nftContract,
        tokenId: parseInt(tokenId),
        status: "active",
        AND: [
          {
            OR: [
              { expiry: null }, // No expiry set
              { expiry: { gte: currentTimestamp } }, // Expiry is in the future
            ],
          },
        ],
      },
    });

    if (!listing) {
      throw new NotFoundError(`Listing not found`);
    }

    return listing;
  }

  /**
   * Retrieves a specific listing by ID.
   * @param id - The ID of the listing to retrieve.
   * @returns The listing with orders.
   * @throws MarketplaceError if the listing is not found.
   */

  async getListing(id: string): Promise<any> {
    const listing = await prisma.listingV2.findUnique({
      where: { id },
      include: { orders: true },
    });

    if (!listing) {
      throw new NotFoundError("Listing not found");
    }

    return listing;
  }

  /**
   * Updates an existing listing by ID.
   * @param id - The ID of the listing to update.
   * @param data - The partial data to update on the listing (excluding the maker).
   * @returns The updated listing with orders.
   * @throws MarketplaceError if the update fails or the listing is not found.
   */

  async updateListing(
    id: string,
    data: Partial<Omit<TListingCreateInput, "maker">>
  ): Promise<any> {
    const listing = await this.getListing(id);

    if (!listing) {
      throw new NotFoundError(`Listing with ID ${id} not found`);
    }

    return await prisma.listingV2.update({
      where: { id },
      data,
      include: { orders: true },
    });
  }

  /**
   * Cancels an existing listing by ID.
   * @param id - The ID of the listing to cancel.
   * @param maker - The maker of the listing, used for authorization.
   * @returns The cancelled listing with orders.
   * @throws MarketplaceError if the listing is not found, or unauthorized.
   */

  async cancelListing(id: string, maker: string): Promise<any> {
    const listing = await this.getListing(id);

    if (!listing) {
      throw new NotFoundError(`Listing with ID ${id} not found`);
    }
    console.log(listing.maker);
    console.log(maker);
    if (listing.maker !== maker) {
      throw new ForbiddenError("Unauthorized");
    }

    return await prisma.listingV2.update({
      where: { id },
      data: { status: "cancelled" as TListingStatus },
      include: { orders: true },
    });
  }

  /**
   * Cancels an existing listing by contract and token id.
   * @param id - The ID of the listing to cancel.
   * @param maker - The maker of the listing, used for authorization.
   * @returns The cancelled listing with orders.
   * @throws MarketplaceError if the listing is not found, or unauthorized.
   */

  async cancelListingByTokenID(
    contract: string,
    tokenId: any,
    maker: string
  ): Promise<any> {
    const listing = await this.getCurrentActiveListing(contract, tokenId);

    if (!listing) {
      throw new NotFoundError(
        `Listing with contract ${contract} and token id ${tokenId} not found`
      );
    }
    console.log(listing.maker);
    console.log(maker);
    if (listing.maker !== maker) {
      throw new ForbiddenError("Unauthorized");
    }
    console.log("listing", listing);
    return await prisma.listingV2.update({
      where: { id: listing.id },
      data: { status: "cancelled" as TListingStatus },
      include: { orders: true },
    });
  }

  /**
   * update status sold an existing listing by contract and token id.
   * @param id - The ID of the listing to cancel.
   * @param maker - The maker of the listing, used for authorization.
   * @returns The cancelled listing with orders.
   * @throws MarketplaceError if the listing is not found, or unauthorized.
   */

  async updateSold(
    contract: string,
    tokenId: any,
    maker: string
  ): Promise<any> {
    const listing = await this.getCurrentActiveListing(contract, tokenId);

    if (!listing) {
      throw new NotFoundError(
        `Listing with contract ${contract} and token id ${tokenId} not found`
      );
    }
    console.log(listing.maker);
    console.log(maker);
    if (listing.maker !== maker) {
      throw new ForbiddenError("Unauthorized");
    }
    console.log("listing", listing);
    return await prisma.listingV2.update({
      where: { id: listing.id },
      data: { status: "sold" as TListingStatus },
      include: { orders: true },
    });
  }
}
