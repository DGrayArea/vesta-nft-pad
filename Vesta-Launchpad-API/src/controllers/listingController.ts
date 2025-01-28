import { Response, NextFunction } from "express";
import prisma from "../common/prisma-client";
import configs from "../config/serverConfig";
import {
  HTTP_STATUS_CODE,
  REQUEST_METHOD,
  VALIDATION_MESSAGES,
  MESSAGES,
  PURCHASE_STATUS,
  TRANSACTION_METHODS,
} from "../common/constants";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "../helpers/responseHelpers";
import { IListingRequest, NFTStatus } from "../helpers/Interface";
import { verifyNFTOwnership } from "../helpers/verifyOwnership";
import {
  getNFTByTokenId,
  getNFTsForContract,
  getNFTsForOwner,
} from "../helpers/getNFtsFromProvider";
import {
  countTraits,
  filterNFTs,
  listedNftsNFTs,
  sendMessageToUser,
  signMessage,
} from "../helpers/utils";
// import moment from "moment";
import { parseEther } from "ethers";
import { getPurchaseNftEventLogs } from "../helpers/eventLogs";
import { logger } from "../helpers/loggers";
import { cloudlog } from "../helpers/cloudwatchLogger";
import { getContractByAddress } from "@/services/thirdweb/utils/get-contract-by-address";
import { MARKETPLACE } from "@/services/thirdweb/constants";
import {
  generateNFTKey,
  getDirectListedKeySet,
} from "@/services/thirdweb/reads/getDirectListedKeySet";

export const getAllListingsHistoryByNft = async (
  req: IListingRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }
    const { contractAddress, tokenId } = req.params;

    const listings = await prisma.listing.findMany({
      where: { contractAddress, tokenId: parseInt(tokenId) },
      include: {
        bids: true,
      },
    });

    if (!listings || listings.length <= 0) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      listings,
      VALIDATION_MESSAGES.CONTRACT_LISTING_RETRIEVED
    );
  } catch (error) {
    console.error(error);
    logger.error(error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

export const getAllListedNft = async (
  req: IListingRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }
    const { page, limit, collectionNames, categories, priceRange } = req.query;
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const listedNfts = await prisma.listing.findMany({
      where: { isListed: true },
      include: {
        bids: {
          include: {
            bidder: {
              select: {
                email: true,
                fname: true,
                lname: true,
                address: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!listedNfts || listedNfts.length === 0) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }
    const nfts: any = [];

    for (const nft of listedNfts) {
      const nftData = await getNFTByTokenId(nft.contractAddress, nft.tokenId);
      if (!nftData || nftData.length === 0) {
        cloudlog.info("listed nft not found in alchmy something went wrong");
      }
      const collection = await prisma.collection.findUnique({
        where: { contractAddress: nft.contractAddress },
        include: {
          application: true,
        },
      });

      const nftBids = await prisma.bid.findMany({
        where: {
          contractAddress: nft.contractAddress,
          tokenId: nft.tokenId,
          isBid: true,
        },
        include: {
          bidder: {
            select: {
              email: true,
              fname: true,
              lname: true,
              address: true,
              profileImage: true,
            },
          },
        },
      });
      const likes = await prisma.nFTLikes.findMany({
        where: { contractAddress: nft.contractAddress, tokenId: nft.tokenId },
      });

      nfts.push({
        collection: collection,
        nft: nftData,
        listing: nft,
        bids: nftBids,
        likes: likes,
      });
    }
    const filterOptions = {
      collectionNames,
      categories,
      priceRange: {
        min: parseFloat(priceRange?.min) || 0,
        max: parseFloat(priceRange?.max) || Infinity,
      },
    };
    const filteredNFTs = listedNftsNFTs(nfts, filterOptions);

    filteredNFTs.slice(skip, skip + parsedLimit); // paginate the result

    if (filteredNFTs.length <= 0) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    // Calculate total count for pagination
    const totalCount = listedNfts.length;
    const totalPages = Math.ceil(totalCount / parsedLimit);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: filteredNFTs,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.CONTRACT_LISTING_RETRIEVED
    );
  } catch (error) {
    console.error(error);
    logger.error(error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

export const getAllNftsByCollection = async (
  req: IListingRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }
    const { contractAddress } = req.params;
    const { page, limit } = req.query;
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const collection = await prisma.collection.findUnique({
      where: { contractAddress },
      include: {
        application: true,
      },
    });

    if (!collection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );
    }

    const nftData = await getNFTsForContract(contractAddress);

    if (nftData.length === 0) {
      cloudlog.info("There are no NFTs owned by the specified account.");
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    const listings = await prisma.listing.findMany({
      where: { contractAddress, isListed: true },
      include: {
        bids: {
          include: {
            bidder: {
              select: {
                email: true,
                fname: true,
                lname: true,
                address: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });
    const bids = await prisma.bid.findMany({
      where: { contractAddress, isBid: true },
      include: {
        bidder: {
          select: {
            email: true,
            fname: true,
            lname: true,
            address: true,
            profileImage: true,
          },
        },
      },
    });
    const likes = await prisma.nFTLikes.findMany({
      where: { contractAddress },
    });
    const nfts: any = [];

    for (const nft of nftData) {
      const listing = listings.find((list) => list.tokenId == nft.tokenId);
      const nftBids = bids.filter((bid) => bid.tokenId == nft.tokenId);
      const nftLikes = likes.filter((like) => like.tokenId == nft.tokenId);

      const nftWithDetails = {
        ...nft,
        listing: listing || null,
        bids: nftBids,
        likes: nftLikes,
      };

      nfts.push(nftWithDetails);
    }

    nfts.sort((a, b) => {
      const aIsListed = a.listing && a.listing.isListed;
      const bIsListed = b.listing && b.listing.isListed;

      if (aIsListed && !bIsListed) {
        return -1;
      } else if (!aIsListed && bIsListed) {
        return 1;
      }
      return 0;
    });

    nfts.slice(skip, skip + parsedLimit);

    if (nfts.length <= 0) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    // Calculate total count for pagination
    const totalCount = nftData.length;
    const totalPages = Math.ceil(totalCount / parsedLimit);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: { collection: collection, nfts: nfts },
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.CONTRACT_LISTING_RETRIEVED
    );
  } catch (error) {
    console.error(error);
    logger.error(error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

export const getAllNftsByCollectionWithFilter = async (
  req: IListingRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }
    const { contractAddress } = req.params;
    const { page, limit } = req.query;
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;
    const filterCriteria = req.body.filter;

    const collection = await prisma.collection.findUnique({
      where: { contractAddress },
      include: {
        application: true,
      },
    });

    if (!collection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );
    }

    const nftData = await getNFTsForContract(contractAddress);

    if (nftData.length === 0) {
      cloudlog.info("There are no NFTs owned by the specified account.");
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    const listings = await prisma.listing.findMany({
      where: { contractAddress, isListed: true },
      include: {
        bids: {
          include: {
            bidder: {
              select: {
                email: true,
                fname: true,
                lname: true,
                address: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    const bids = await prisma.bid.findMany({
      where: { contractAddress, isBid: true },
      include: {
        bidder: {
          select: {
            email: true,
            fname: true,
            lname: true,
            address: true,
            profileImage: true,
          },
        },
      },
    });

    const likes = await prisma.nFTLikes.findMany({
      where: { contractAddress },
    });

    const highestBidAmount = await prisma.bid.findFirst({
      where: { contractAddress, isBid: true },
      select: {
        amount: true,
      },
      orderBy: {
        amount: "desc",
      },
    });

    const nfts: any = [];

    for (const nft of nftData) {
      const listing = listings.find((list) => list.tokenId == nft.tokenId);
      const nftBids = bids.filter((bid) => bid.tokenId == nft.tokenId);
      const nftLikes = likes.filter((like) => like.tokenId == nft.tokenId);

      const nftWithDetails = {
        ...nft,
        listing: listing || null,
        bids: nftBids,
        likes: nftLikes,
      };

      nfts.push(nftWithDetails);
    }

    // Filter NFTs based on filterCriteria from request body or params
    const filteredNFTs = filterNFTs(nfts, filterCriteria);

    filteredNFTs.sort((a, b) => {
      const aIsListed = a.listing && a.listing.isListed;
      const bIsListed = b.listing && b.listing.isListed;

      if (aIsListed && !bIsListed) {
        return -1;
      } else if (!aIsListed && bIsListed) {
        return 1;
      }
      return 0;
    });

    filteredNFTs.slice(skip, skip + parsedLimit);

    if (filteredNFTs.length <= 0) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    // Calculate total count for pagination
    const totalCount = filteredNFTs.length;
    const totalPages = Math.ceil(totalCount / parsedLimit);

    const totalNftCount = nftData.length;
    const totalListedCount = listings.length;

    const listedPercentage = (totalListedCount / totalNftCount) * 100;

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: {
          collection: {
            ...collection,
            listedPercentage,
            bestOffer: highestBidAmount?.amount || 0,
          },
          nfts: filteredNFTs,
        },
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.CONTRACT_LISTING_RETRIEVED
    );
  } catch (error) {
    console.error(error);
    logger.error(error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

export const getAllNftCollectionTraits = async (
  req: IListingRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }
    const { contractAddress } = req.params;

    const collection = await prisma.collection.findUnique({
      where: { contractAddress },
      include: {
        application: true,
      },
    });

    if (!collection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );
    }

    const nftData = await getNFTsForContract(contractAddress);

    if (nftData.length === 0) {
      cloudlog.info("There are no NFTs owned by the specified account.");
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    if (nftData.length <= 0) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    const traitCounters = countTraits(nftData);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: {
          collection: collection,
          traits: traitCounters,
        },
      },
      VALIDATION_MESSAGES.CONTRACT_LISTING_RETRIEVED
    );
  } catch (error) {
    console.error(error);
    logger.error(error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

export const getMyNfts = async (
  req: IListingRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }
    const { accountAddress } = req.params;
    const { status = "all" } = req.query;

    const contract = getContractByAddress({
      address: MARKETPLACE,
      chain: "BASESEPOLIA",
    });

    const collections = await prisma.collection.findMany({
      select: {
        contractAddress: true,
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
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }
    const collectionContractAddresses: any = collections?.map(
      (collection) => collection.contractAddress
    );

    const nftData = await getNFTsForOwner(
      accountAddress,
      collectionContractAddresses || []
    );

    if (nftData.length === 0) {
      cloudlog.info("There are no NFTs owned by the specified account.");
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    // const listings = await prisma.listing.findMany({
    //   where: { ownerOf: accountAddress, isListed: true },
    //   include: {
    //     bids: {
    //       include: {
    //         bidder: {
    //           select: {
    //             email: true,
    //             fname: true,
    //             lname: true,
    //             address: true,
    //             profileImage: true,
    //           },
    //         },
    //       },
    //     },
    //   },
    // });

    // LIVE CHECKER EXTENSION

    const { keySet: directListedKeySet, keyMap } = await getDirectListedKeySet({
      contract,
    });

    const shouldIncludeNFT = (
      nft: { contractAddress: string; tokenId: bigint },
      status: NFTStatus
    ) => {
      const key = generateNFTKey(nft.contractAddress, nft.tokenId);

      if (status === "all") {
        return true; // all
      }

      if (status === "unlisted") {
        return !directListedKeySet.has(key); // unlisted
      }

      if (status === "listed") {
        return directListedKeySet.has(key); // listed
      }

      return false;
    };

    const getNFTStatus = (has: boolean): NFTStatus => {
      return has ? "listed" : "unlisted";
    };

    const combinedData = nftData
      .filter((nft) => shouldIncludeNFT(nft, status))
      .map((nft) => {
        const key = generateNFTKey(nft.contractAddress, nft.tokenId);
        const has = directListedKeySet.has(key);

        return {
          ...nft,
          status: getNFTStatus(has),
          listingId: has ? keyMap.get(key) : null,
        };
      });

    // EXISTED WAY
    // const combinedData = nftData.map((nft) => {
    //   const listing = listings.find((list) => list.tokenId === nft.tokenId);

    //   return {
    //     ...nft,
    //     listing: listing || null,
    //   };
    // });

    if (combinedData.length === 0) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: { nfts: combinedData },
      },
      VALIDATION_MESSAGES.CONTRACT_LISTING_RETRIEVED
    );
  } catch (error) {
    console.error(error);
    logger.error(error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

/**
 * This function handles the API call for find listing data by specific id
 *
 * @param {IListingRequest} req - req listing id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const getNftByTokenId = async (
  req: IListingRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }
    const { tokenId, contractAddress } = req.params;

    const listing = await prisma.listing.findFirst({
      where: {
        contractAddress,
        tokenId: parseInt(tokenId),
        isListed: true,
      },
      include: {
        bids: {
          include: {
            bidder: {
              select: {
                email: true,
                fname: true,
                lname: true,
                address: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    const nftData = await getNFTByTokenId(contractAddress, parseInt(tokenId));

    if (!nftData || nftData.length === 0) {
      cloudlog.info("There are no NFT");
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      { nft: { ...nftData, listing: listing || null } },
      VALIDATION_MESSAGES.LISTING_RETRIEVED
    );
  } catch (error) {
    console.error(error);
    logger.error(error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

/**
 * Handles the API call for list nft.
 *
 * @param {IListingRequest} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<Response>} A response object containing a status, data, and message.
 */
export const listNft = async (
  req: IListingRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    cloudlog.info("Creating listing - function started");
    cloudlog.info(`Request details:
    method: ${req.method},
    url: ${req.url},
    userId: ${req.user?.id}`);

    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }

    const userID: any = req.user?.id ? req.user.id : undefined;
    cloudlog.info(`Creating listing. User id ${userID}`);
    const {
      tokenId,
      contractAddress,
      price,
      currency,
      startDate,
      endDate,
      message,
      nounce,
      signature,
      ownerOf,
    } = req.body;

    cloudlog.info(`Request body:
    tokenId: ${req.body.tokenId},
    contractAddress: ${req.body.contractAddress}`);

    cloudlog.info(`Verifying Ownership - function start`);
    const isValid = await verifyNFTOwnership(
      contractAddress,
      tokenId,
      message,
      signature
    );

    cloudlog.info(`Verifying  Ownership Results ${isValid}`);

    if (!isValid) {
      sendMessageToUser(
        ownerOf,
        "Listing",
        null,
        "NFT ownership could not be verified. or something went wrong",
        false
      );

      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "NFT ownership could not be verified. or something went wrong"
      );
    }

    cloudlog.info(`Finding listed Record - function start`);
    const isListed = await prisma.listing.findFirst({
      where: {
        contractAddress: contractAddress,
        tokenId: tokenId,
        ownerOf: ownerOf,
        isListed: true,
      },
    });
    cloudlog.info(
      `Finding listed Record - function end. Result: ${isListed?.id}`
    );

    if (isListed) {
      sendMessageToUser(
        ownerOf,
        "Listing",
        null,
        "This Nft Already Listed",
        false
      );
      cloudlog.error(VALIDATION_MESSAGES.LISTING_ALREADY_EXIST);
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.LISTING_ALREADY_EXIST
      );
    }

    cloudlog.info(`Creating Listing - function start`);
    const listing = await prisma.listing.create({
      data: {
        price,
        currency,
        startDate,
        endDate,
        tokenId: tokenId,
        ownerOf: ownerOf,
        contractAddress,
        isListed: true,
        isSold: false,
        nounce,
        signature,
        sellerId: userID,
      },
    });
    cloudlog.info(`Creating Listing - function end. Result: ${listing?.id}`);

    cloudlog.info(`Finding Floor Price - function start`);
    const floorPrice = await prisma.listing.findFirst({
      where: { contractAddress, isListed: true },
      orderBy: { price: "asc" },
      select: { price: true },
    });
    cloudlog.info(
      `Finding Floor Price - function end. Result:${floorPrice?.price}`
    );

    cloudlog.info(`Updating Collection - function start`);
    const updatedCollection = await prisma.collection.update({
      where: { contractAddress },
      data: { floorPrice: floorPrice?.price },
    });
    cloudlog.info(`Collection Updated function end`);

    sendMessageToUser(ownerOf, "Listing", listing, "Successfully Listed", true);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
      { listing, collection: updatedCollection },
      VALIDATION_MESSAGES.CREATE_LISTING
    );
  } catch (error) {
    cloudlog.error(error.message);
    console.error(error);
    logger.error(error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

export const purchaseNft = async (
  req: IListingRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    cloudlog.info("purchaseNft function started");
    const { id } = req.params;
    const listingID = parseInt(id);
    const userID: any = req.user?.id ? req.user.id : undefined;

    cloudlog.info(
      `Request details: method: ${req.method}, url: ${req.url}, userId: ${userID}`
    );

    const listing = await prisma.listing.findUnique({
      where: { id: listingID },
    });

    if (!listing) {
      cloudlog.warn("Listing not found");
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_LISTING
      );
    }

    if (!listing.isListed) {
      cloudlog.warn("Listing not available");
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.LISTING_NOT_AVAILABLE
      );
    }

    const purchasePrice = listing?.price;

    // Get the current block timestamp in seconds
    const currentBlockTimestamp = Math.floor(Date.now() / 1000);

    // Convert the block timestamp to milliseconds
    const timestampInMilliseconds = currentBlockTimestamp * 1000;

    // Add 2 minutes (2 * 60 seconds) to the timestamp
    const newTimestampInMilliseconds = timestampInMilliseconds + 2 * 60 * 1000;

    // Convert the new timestamp back to seconds
    const validity = Math.floor(newTimestampInMilliseconds / 1000);

    // const currentTime = moment();
    // const validity = moment(currentTime).add(5, "minutes").unix();

    cloudlog.info("Generating signature");

    const signature = await signMessage(
      listing.contractAddress,
      listing.tokenId,
      parseEther(String(purchasePrice)),
      listing.nounce,
      listing.ownerOf,
      validity,
      userID,
      configs.serverBrokerPrivateKey
    );

    cloudlog.info("Purchase successful");

    // ! update listing to sold ????
    // await prisma.listing.update({
    //   where: { id: listing.id },
    //   data: { isSold: true },
    // });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      { listing, signature, validity, buyerId: userID },
      VALIDATION_MESSAGES.PURCHASE_SUCCESS
    );
  } catch (error) {
    console.error(error);
    logger.error(error);
    cloudlog.error("Purchase failed", { error: error.message });
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

export const purchaseNftEventLog = async (
  req: IListingRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    const { txHash } = req.params;

    cloudlog.info("purchaseNftEventLog function started", { txHash });

    const eventLogs = await getPurchaseNftEventLogs(txHash);

    if (!eventLogs) {
      cloudlog.debug(JSON.stringify(eventLogs));
      cloudlog.error("Purchase event logs not found", { txHash });
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "something went wrong with purchase eventLogs"
      );
    }

    cloudlog.info("Retrieved purchase event logs", { txHash, eventLogs });

    //the transaction
    await prisma.transaction.create({
      data: {
        blockHash: eventLogs[0].blockHash,
        blockNumber: eventLogs[0].blockNumber,
        contractAddress: eventLogs[0].contractAddress,
        method: TRANSACTION_METHODS.PURCHASE_NFT,
        from: eventLogs[0].from,
        to: eventLogs[0].to,
        tokenId: eventLogs[0].tokenId,
        txHash: eventLogs[0].transactionHash,
        cumulativeGasUsed: eventLogs[0].cumulativeGasUsed,
        gasPrice: eventLogs[0].gasPrice,
        gasUsed: eventLogs[0].gasUsed,
        price: eventLogs[0].price,
        txnFee: eventLogs[0].txnFee, // gasUsed * gasPrice
      },
    });

    cloudlog.info("Transaction created successfully", { txHash });

    const existingListing: any = await prisma.listing.findFirst({
      where: {
        tokenId: eventLogs[0].tokenId,
        contractAddress: eventLogs[0].contractAddress,
        ownerOf: eventLogs[0].seller,
        isListed: true,
      },
    });

    if (!existingListing) {
      sendMessageToUser(
        eventLogs[0].buyer,
        "Listing",
        null,
        "Invalid listing, something went wrong with purchase",
        false
      );

      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "Invalid listing, something went wrong with purchase"
      );
    }

    if (existingListing?.isPurchaseEventHappend) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "already purchase in event listener"
      );
    }

    cloudlog.info("Transaction created successfully", { txHash });

    const purchase = await prisma.purchase.create({
      data: {
        listingId: existingListing!.id,
        buyerId: eventLogs[0].userId,
        price: eventLogs[0].price,
        purchaseStatus: PURCHASE_STATUS.COMPLETED,
      },
      include: {
        listing: true,
      },
    });

    cloudlog.info("Purchase record created", {
      txHash,
      purchaseId: purchase.id,
    });

    const listing = await prisma.listing.update({
      where: { id: existingListing!.id },
      data: { isListed: false, isSold: true, ownerOf: eventLogs[0].buyer },
    });

    cloudlog.info("Listing updated", { txHash, listingId: listing.id });

    const floorPrice = await prisma.listing.findFirst({
      where: { contractAddress: eventLogs[0].contractAddress, isListed: true },
      orderBy: { price: "asc" },
      select: { price: true },
    });

    // Increment the total purchase price of the collection and the floor price
    const updateCollection = await prisma.collection.update({
      where: { contractAddress: eventLogs[0].contractAddress },
      data: {
        floorPrice: floorPrice?.price,
        totalVolume: {
          increment: purchase.price,
        },
      },
    });

    cloudlog.info("Updated collection stats", {
      txHash,
      collectionAddress: eventLogs[0].contractAddress,
    });

    sendMessageToUser(
      eventLogs[0].buyer,
      "Listing",
      { purchase, listing, collection: updateCollection },
      "NFT purchased successfully",
      false
    );

    cloudlog.info("Purchase success notification sent", {
      txHash,
      recipient: eventLogs[0].buyer,
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      { purchase, listing },
      VALIDATION_MESSAGES.PURCHASE_SUCCESS
    );
  } catch (error) {
    console.error(error);
    logger.error(error);

    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

export const cancelListNft = async (
  req: IListingRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.PATCH) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.PATCH} Allowed`
      );
    }
    const { id } = req.params;
    const listingID = parseInt(id);
    const { tokenId, contractAddress, message, signature, ownerOf } = req.body;

    cloudlog.info(`Verifying  Ownership.`);
    const isValid = await verifyNFTOwnership(
      contractAddress,
      tokenId,
      message,
      signature
    );

    cloudlog.info(`Verifying  Ownership Results ${isValid}`);

    if (!isValid) {
      sendMessageToUser(
        ownerOf,
        "Listing",
        null,
        "NFT ownership could not be verified. or something went wrong",
        false
      );

      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "NFT ownership could not be verified. or something went wrong"
      );
    }

    const isListed = await prisma.listing.findFirst({
      where: {
        id: listingID,
      },
    });

    if (!isListed) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_LISTING
      );
    }

    const listing = await prisma.listing.update({
      where: { id: listingID },
      data: {
        isListed: false,
        isSold: false,
      },
    });

    const floorPrice = await prisma.listing.findFirst({
      where: { id: listingID, isListed: true },
      orderBy: { price: "asc" },
      select: { price: true },
    });

    const updateCollection = await prisma.collection.update({
      where: { contractAddress: listing.contractAddress },
      data: { floorPrice: floorPrice?.price },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
      { listing, collection: updateCollection },
      VALIDATION_MESSAGES.DE_LISTING
    );
  } catch (error) {
    console.error(error);
    logger.error(error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

export const getFavouritedNfts = async (
  req: IListingRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const { page, limit } = req.query;
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;
    const skip = (parsedPage - 1) * parsedLimit;

    let likedNfts = await prisma.nFTLikes.groupBy({
      by: ["contractAddress", "tokenId"],
      _count: true,
    });

    likedNfts = likedNfts.sort((a, b) => b._count - a._count);

    const favouritedNfts = await Promise.all(
      likedNfts.map(async (likedNft) => {
        const collection = await prisma.collection.findUnique({
          where: { contractAddress: likedNft.contractAddress },
          select: {
            floorPrice: true,
            name: true,
          },
        });

        const nftData = await getNFTByTokenId(
          likedNft.contractAddress,
          likedNft.tokenId
        );

        return {
          collectionName: collection?.name,
          collectionAddress: likedNft.contractAddress,
          // currentOwner: nftData,
          floorPrice: collection?.floorPrice,
          tokenImage: nftData.image,
          likes: likedNft._count,
          tokenId: likedNft.tokenId,
        };
      })
    );

    const selectedNfts = favouritedNfts.slice(skip, skip + parsedLimit);

    if (likedNfts.length <= 0) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    const totalCount = likedNfts.length;
    const totalPages = Math.ceil(totalCount / parsedLimit);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: selectedNfts,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      MESSAGES.DATA_SUCCESS
    );
  } catch (error) {
    console.error(error);
    logger.error(error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};
