import { NextFunction, Response } from "express";
// import prisma from "../common/prisma-client";
import { getNFTsByRefs } from "@/services/thirdweb/reads/getBatchedNFTs";
import { serializeBigIntObj } from "@/services/thirdweb/utils/serialize";
import {
  HTTP_STATUS_CODE,
  MESSAGES,
  REQUEST_METHOD,
  VALIDATION_MESSAGES,
} from "../common/constants";
import prisma from "../common/prisma-client";
import {
  IGetLikedPaginatedRequest,
  IGetLikedRequest,
  IGetLikesCountRequest,
  ILikeRequest,
} from "../helpers/Interface";
import { logger } from "../helpers/loggers";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "../helpers/responseHelpers";
// import { VALIDATION_MESSAGES } from "../common/constants";

export const likeNFT = async (
  req: ILikeRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }
    const { contractAddress, tokenId, walletAddress } = req.body;
    // Check if the user already liked the NFT
    const existingLike = await prisma.nFTLikes.findFirst({
      where: {
        contractAddress,
        tokenId,
        walletAddress,
      },
    });

    if (existingLike) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        VALIDATION_MESSAGES.NFT_ALREADY_LIKED
      );
    }

    const uid = Number(req?.user?.id);

    const like = await prisma.nFTLikes.create({
      data: {
        contractAddress,
        tokenId,
        walletAddress,
        userId: uid,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      like,
      VALIDATION_MESSAGES.NFT_LIKE_SUCCESS
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

export const unlikeNFT = async (
  req: ILikeRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }

    if (!req.user || !req.user.id) {
      throw new Error(`User is required`);
    }

    const userId = Number(req.user.id);

    const { contractAddress, tokenId } = req.body;

    const isNft = await prisma.nFTLikes.findFirst({
      where: { tokenId, contractAddress, userId },
    });

    if (!isNft) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        VALIDATION_MESSAGES.NFT_NOT_FOUND
      );
    }

    const isLiked = await prisma.nFTLikes.findFirst({
      where: { tokenId, contractAddress, userId },
    });

    if (!isLiked) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        VALIDATION_MESSAGES.NFT_NOT_LIKED
      );
    }

    // Delete the like record if it exists
    const deletedLike = await prisma.nFTLikes.delete({
      where: { id: isLiked.id },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      deletedLike,
      VALIDATION_MESSAGES.NFT_UNLIKE_SUCCESS
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

export const getLikedTokens = async (
  req: IGetLikedRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    // const userID = req.user?.id ? req.user.id : undefined;
    const params = req?.query;

    const whereConditions = {
      walletAddress: params.walletAddress,
      ...(params.contractAddress
        ? { contractAddress: params.contractAddress }
        : {}),
    };

    const likedNfts = await prisma.nFTLikes.findMany({
      where: whereConditions,
      select: {
        contractAddress: true,
        tokenId: true,
      },
    });

    const groupedLikes = likedNfts.reduce((acc, nft) => {
      if (!acc[nft.contractAddress]) {
        acc[nft.contractAddress] = {
          contractAddress: nft.contractAddress,
          tokenIds: [],
        };
      }
      acc[nft.contractAddress].tokenIds.push(nft.tokenId);
      return acc;
    }, {});

    const liked = Object.values(groupedLikes);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      liked,
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

export const getLikedTokensWithMeta = async (
  req: IGetLikedPaginatedRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    console.log("querying meta");

    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    if (!req.user || !req.user.id) {
      throw new Error(`User is required`);
    }

    const uid = Number(req.user.id);
    const params = req.query;

    const page = Number(params?.page || 1);
    const pageSize = Number(params?.limit || 10);

    // const wallet = await prisma.linkWallet.findUniqueOrThrow({
    //   where: {
    //     address: params.walletAddress,
    //     userId: uid,
    //   },
    // });

    const whereConditions = {
      userId: uid,
      ...(params.contractAddress
        ? { contractAddress: params.contractAddress }
        : {}),
    };

    const [totalCount, likedNfts] = await Promise.all([
      prisma.nFTLikes.count({
        where: whereConditions,
      }),

      prisma.nFTLikes.findMany({
        where: whereConditions,
        select: {
          contractAddress: true,
          tokenId: true,
          walletAddress : true
          // maybe chain
        },

        // PAG
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // const groupedLikes = likedNfts.reduce((acc, nft) => {
    //   if (!acc[nft.contractAddress]) {
    //     acc[nft.contractAddress] = {
    //       contractAddress: nft.contractAddress,
    //       tokenIds: [],
    //     };
    //   }
    //   acc[nft.contractAddress].tokenIds.push(nft.tokenId);
    //   return acc;
    // }, {});

    const nfts = await getNFTsByRefs({ chain: params.chain, ref: likedNfts });

    const parsedNFTs = serializeBigIntObj(nfts);

    const totalPages = Math.ceil(totalCount / pageSize);

    const pagination = {
      data: parsedNFTs,
      pagination: {
        totalPages,
        currentPage: page,
        totalResults: totalCount,
        resultsPerPage: pageSize,
      },
    };

    // const liked = Object.values(groupedLikes);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      pagination,
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

export const getLikesCount = async (
  req: IGetLikesCountRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const userId = Number(req?.user?.id);

    const { contractAddress, tokenId } = req.query;

    const whereConditions = { contractAddress, tokenId: Number(tokenId) };

    const [count, likedRes] = await Promise.all([
      prisma.nFTLikes.count({ where: whereConditions }),

      userId
        ? prisma.nFTLikes.findFirst({
            where: { ...whereConditions, userId },
          })
        : null,
    ]);

    const data = {
      count,
      isLiked: Boolean(likedRes),
    };

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      data,
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
