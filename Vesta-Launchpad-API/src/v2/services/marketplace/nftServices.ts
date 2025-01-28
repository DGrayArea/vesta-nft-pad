import { VALIDATION_MESSAGES } from "@/common/constants";
import prisma from "@/common/prisma-client";
import { cloudlog } from "@/helpers/cloudwatchLogger";
import {
  getNFTByTokenId,
  getNFTsForContract,
  getNFTsForOwner,
  getNFTsForOwnerBulk,
} from "@/v2/helper/alchemyFetchData";
import { NotFoundError } from "@/v2/helper/api-errors";
import { TNftFilters, TNftServiceResponse } from "@/v2/types/marketplace/nfts";

export class NftService {
  /**
   * Gets NFTs for a collection with their listings and orders
   * @param contract - The collection's contract address
   * @param filters - The filters to apply to the collection nfts search.
   * @returns Collection data with NFTs and pagination info
   * @throws NotFoundError if collection doesn't exist
   */

  async getNFTsByCollection(
    contract: string,
    filters: TNftFilters
  ): Promise<TNftServiceResponse> {
    {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;
      const status = filters.status || "all";
      // Get collection data
      const collection = await prisma.collection.findUnique({
        where: { contractAddress: contract },
        include: {
          application: true,
        },
      });

      if (!collection) {
        throw new NotFoundError(VALIDATION_MESSAGES.INVALID_COLLECTION);
      }

      // Get NFT data from Alchemy
      const nftData = await getNFTsForContract(contract);

      if (nftData.length === 0) {
        throw new NotFoundError(VALIDATION_MESSAGES.NFT_NOT_FOUND);
      }
      // Get active listings for the contract
      const listings = await prisma.listingV2.findMany({
        where: {
          nftContract: contract,
          status: "active",
        },
      });

      const listingsMap = new Map(
        listings.map((listing) => [
          `${listing.nftContract}-${listing.tokenId}`,
          listing,
        ])
      );

      const filteredNfts = nftData.filter((nft) => {
        const nftKey = `${nft.contractAddress}-${nft.tokenId}`;
        const isListed = listingsMap.has(nftKey);

        if (status === "all") return true;
        if (status === "listed") return isListed;
        if (status === "unlisted") return !isListed;
        return false;
      });

      // Sort NFTs to show listed ones first
      filteredNfts.sort((a, b) => {
        const aIsListed = listingsMap.has(`${a.contractAddress}-${a.tokenId}`);
        const bIsListed = listingsMap.has(`${b.contractAddress}-${b.tokenId}`);

        if (aIsListed && !bIsListed) {
          return -1; // a is listed, b is not
        } else if (!aIsListed && bIsListed) {
          return 1; // b is listed, a is not
        }
        return 0; // if both are either listed or unlisted
      });

      // Apply pagination: slice the filtered NFTs to return only the required page
      const paginatedData = filteredNfts.slice(skip, skip + limit);

      // Map NFTs to include the listing status
      const combinedData = paginatedData.map((nft) => {
        const nftKey = `${nft.contractAddress}-${nft.tokenId}`;
        const isListed = listingsMap.has(nftKey);
        const listing = listingsMap.get(nftKey);

        return {
          ...nft,
          status: isListed ? "listed" : "unlisted",
          isListed,
          listingId: listing ? listing.id : null,
          listing: listing || null,
        };
      });

      if (combinedData.length === 0) {
        throw new NotFoundError(VALIDATION_MESSAGES.NFT_NOT_FOUND);
      }

      return {
        collection,
        nfts: combinedData,
        pagination: {
          total: nftData.length,
          pages: Math.ceil(nftData.length / limit),
          currentPage: page,
          limit: limit,
        },
      };
    }
  }

  /**
   * Gets NFT details by token ID and contract address
   * @param contract - The NFT contract address
   * @param tokenId - The token ID
   * @returns NFT data with listing information
   * @throws NotFoundError if NFT doesn't exist
   */
  async getNftByTokenId(contract: string, tokenId: number) {
    const collection = await prisma.collection.findUnique({
      where: { contractAddress: contract },
    });

    if (!collection) {
      cloudlog.info("NFT not found");
      throw new NotFoundError(VALIDATION_MESSAGES.COLLECTION__NOT_FOUND);
    }

    const listing = await prisma.listingV2.findFirst({
      where: {
        nftContract: contract,
        tokenId: tokenId,
        status: "active",
      },
    });

    const nftData = await getNFTByTokenId(contract, tokenId);

    if (!nftData || nftData.length === 0) {
      cloudlog.info("NFT not found");
      throw new NotFoundError(VALIDATION_MESSAGES.NFT_NOT_FOUND);
    }

    return {
      collection,
      nft: {
        ...nftData,
        isListed: listing ? true : false,
        listingId: listing ? listing.id : null,
        listing: listing || null,
      },
    };
  }

  /**
   * Retrieves NFTs owned by a specific account with listing status and pagination
   * @param accountAddress - The owner's account address
   * @param filters - The filter object containing status, page, and limit
   * @returns NFTs owned by the account with listing info
   */
  async getMyNfts(
    accountAddress: string,
    filters: { status: any; page: number; limit: number }
  ) {
    console.log("account address :", accountAddress);

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;
    const status = filters.status;

    const collectionsMap = new Map();

    const collections = await prisma.collection.findMany({
      select: {
        contractAddress: true,
        name: true,
        logoImage: true,
        featuredImage: true,
        chain: true,
        bannerImage: true,
        category: true,
        floorPrice: true,
        symbol: true,
        creatorEarning: true,
        vestaEarning: true,
        application: true,
      },
      where: {
        contractAddress: {
          not: {
            // @ts-ignore
            equals: null || undefined,
          },
        },
      },
    });

    if (collections.length === 0) {
      cloudlog.info("There are no collections with contract addresses.");
      throw new NotFoundError(VALIDATION_MESSAGES.COLLECTION__NOT_FOUND);
    }

    collections.forEach((collection) => {
      collectionsMap.set(collection.contractAddress, collection);
    });

    const collectionContractAddresses: any = collections?.map(
      (collection) => collection.contractAddress
    );

    const nftData = await getNFTsForOwner(
      accountAddress,
      collectionContractAddresses || []
    );
    if (nftData.length === 0) {
      cloudlog.info("There are no NFTs owned by the specified account.");
      throw new NotFoundError(
        "There are no NFTs owned by the specified account."
      );
    }

    const listings = await prisma.listingV2.findMany({
      where: {
        nftContract: { in: collectionContractAddresses },
        maker: accountAddress,
        status: "active",
      },
      select: {
        nftContract: true,
        tokenId: true,
        id: true,
        maker: true,
        price: true,
        expiry: true,
      },
    });

    const listingsMap = new Map(
      listings.map((listing) => [
        `${listing.nftContract}-${listing.tokenId}`,
        listing,
      ])
    );

    // Filter NFTs based on the listing status (all, listed, unlisted)
    const filteredNfts = nftData.filter((nft) => {
      const nftKey = `${nft.contractAddress}-${nft.tokenId}`;
      const isListed = listingsMap.has(nftKey);

      if (status === "all") return true;
      if (status === "listed") return isListed;
      if (status === "unlisted") return !isListed;
      return false;
    });

    // Sort NFTs to show listed ones first
    filteredNfts.sort((a, b) => {
      const aIsListed = listingsMap.has(`${a.contractAddress}-${a.tokenId}`);
      const bIsListed = listingsMap.has(`${b.contractAddress}-${b.tokenId}`);

      if (aIsListed && !bIsListed) {
        return -1; // a is listed, b is not
      } else if (!aIsListed && bIsListed) {
        return 1; // b is listed, a is not
      }
      return 0; // if both are either listed or unlisted
    });

    // Apply pagination: slice the filtered NFTs to return only the required page
    const paginatedData = filteredNfts.slice(skip, skip + limit);

    // Map NFTs to include the listing status
    const combinedData = paginatedData.map((nft) => {
      const nftKey = `${nft.contractAddress}-${nft.tokenId}`;
      const isListed = listingsMap.has(nftKey);
      const listing = listingsMap.get(nftKey);
      const collectionDetails = collectionsMap.get(nft.contractAddress);

      return {
        collection: collectionDetails
          ? {
              name: collectionDetails.name,
              bannerImage: collectionDetails.bannerImage,
              category: collectionDetails.category,
              application: collectionDetails.application,
              contractAddress: collectionDetails.contractAddress,
              logoImage: collectionDetails.logoImage,
              featuredImage: collectionDetails.featuredImage,
              chain: collectionDetails.chain,
              floorPrice: collectionDetails.floorPrice,
              symbol: collectionDetails.symbol,
              creatorEarning: collectionDetails.creatorEarning,
              vestaEarning: collectionDetails.vestaEarning,
            }
          : null,
        ...nft,
        status: isListed ? "listed" : "unlisted",
        isListed,
        listingId: listing ? listing.id : null,
        listing: listing || null,
      };
    });

    if (combinedData.length === 0) {
      throw new NotFoundError(VALIDATION_MESSAGES.COLLECTION__NOT_FOUND);
    }

    return {
      nfts: combinedData,
      pagination: {
        total: nftData.length,
        pages: Math.ceil(nftData.length / limit),
        currentPage: page,
        limit,
      },
    };
  }

  /**
   * Retrieves all listed NFTs with collection details and pagination.
   * @param filters - The filter object containing page and limit
   * @returns Listed NFTs with collection details and pagination info
   */
  async getAllListedNfts(filters: { page: number; limit: number }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const listings = await prisma.listingV2.findMany({
      where: {
        status: "active",
      },
      select: {
        nftContract: true,
        tokenId: true,
        id: true,
        maker: true,
        price: true,
        expiry: true,
      },
      skip,
      take: limit,
    });

    console.log("listings:", listings);

    if (listings.length === 0) {
      cloudlog.info("There are no active NFT listings.");
      throw new NotFoundError("No active NFT listings found.");
    }

    // Step 2: Gather the contract addresses from the listings
    const collectionContractAddresses = listings.map(
      (listing) => listing.nftContract
    );

    // Step 3: Fetch all collections associated with those contract addresses
    const collections = await prisma.collection.findMany({
      select: {
        contractAddress: true,
        name: true,
        logoImage: true,
        featuredImage: true,
        chain: true,
        bannerImage: true,
        category: true,
        floorPrice: true,
        symbol: true,
        creatorEarning: true,
        vestaEarning: true,
        application: true,
      },
      where: {
        contractAddress: {
          in: collectionContractAddresses,
        },
      },
    });

    const collectionsMap = new Map();
    collections.forEach((collection) => {
      collectionsMap.set(collection.contractAddress, collection);
    });

    const nftKeys = listings.map(
      (listing) => `${listing.nftContract}-${listing.tokenId}`
    );

    const nftData = await getNFTsForOwnerBulk(
      collectionContractAddresses,
      nftKeys
    );

    // Step 5: Map each listing with its collection details and NFT data
    const combinedData = listings.map((listing) => {
      const nftKey = `${listing.nftContract}-${listing.tokenId}`;
      const nft = nftData.find(
        (nft) => nftKey === `${nft.contractAddress}-${nft.tokenId}`
      );
      const collectionDetails = collectionsMap.get(listing.nftContract);

      return {
        collection: collectionDetails
          ? {
              name: collectionDetails.name,
              bannerImage: collectionDetails.bannerImage,
              category: collectionDetails.category,
              application: collectionDetails.application,
              contractAddress: collectionDetails.contractAddress,
              logoImage: collectionDetails.logoImage,
              featuredImage: collectionDetails.featuredImage,
              chain: collectionDetails.chain,
              floorPrice: collectionDetails.floorPrice,
              symbol: collectionDetails.symbol,
              creatorEarning: collectionDetails.creatorEarning,
              vestaEarning: collectionDetails.vestaEarning,
            }
          : null,
        ...nft,
        status: "listed",
        isListed: true,
        listingId: listing.id,
        listing,
      };
    });

    // Step 6: Return paginated data and the total count for pagination
    const totalListings = await prisma.listingV2.count({
      where: {
        status: "active",
      },
    });

    return {
      nfts: combinedData,
      pagination: {
        total: totalListings,
        pages: Math.ceil(totalListings / limit),
        currentPage: page,
        limit,
      },
    };
  }
}
