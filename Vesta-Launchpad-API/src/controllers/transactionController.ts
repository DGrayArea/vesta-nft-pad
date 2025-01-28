import { verifyClaim } from "@/services/thirdweb/reads/verify-claim";
import {
  PlatformChains,
  platformChainsByIds,
} from "@/services/thirdweb/utils/get-chains";
import { NextFunction, Response } from "express";
import { toEther } from "thirdweb";
import {
  HTTP_STATUS_CODE,
  MESSAGES,
  REQUEST_METHOD,
  TRANSACTION_METHODS,
  VALIDATION_MESSAGES,
} from "../common/constants";
import prisma from "../common/prisma-client";
import { ITransactionRequest } from "../helpers/Interface";
import { logger } from "../helpers/loggers";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "../helpers/responseHelpers";

/**
 * This function handles the API call for showing all transaction data with pagination
 *
 * @param {ITransactionRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const getAllTransaction = async (
  req: ITransactionRequest,
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

    const [totalCount, transactions] = await Promise.all([
      prisma.transaction.count({}),
      prisma.transaction.findMany({
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!transactions || transactions.length <= 0) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    const totalPages = Math.ceil(totalCount / parsedLimit);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: transactions,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.TRANSACTION_RETRIEVED
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
 * This function handles the API call for find transaction data by specific id
 *
 * @param {ITransactionRequest} req - req transaction id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const getTransactionByID = async (
  req: ITransactionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }
    const { id } = req.params;
    const transactionID = parseInt(id);

    const transaction = await prisma.transaction.findUnique({
      where: {
        id: transactionID,
      },
    });

    if (!transaction) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_TRANSACTION
      );
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      transaction,
      VALIDATION_MESSAGES.POST_RETRIEVED
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
 * This function handles the API call for find transaction data by nft
 *
 * @param {ITransactionRequest} req - req transaction id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const getAllNFTTransaction = async (
  req: ITransactionRequest,
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
    const { contractAddress, tokenId } = req.params;

    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const [totalCount, transactions, collection] = await Promise.all([
      prisma.transaction.count({
        where: {
          contractAddress,
          tokenId: parseInt(tokenId),
        },
      }),
      prisma.transaction.findMany({
        where: {
          contractAddress,
          tokenId: parseInt(tokenId),
        },
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.collection.findFirst({
        where: {
          contractAddress,
        },
      }),
    ]);

    if (!transactions || transactions.length <= 0) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    const totalPages = Math.ceil(totalCount / parsedLimit);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: { collection, transactions },
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.TRANSACTION_RETRIEVED
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

export const getAllMyNFTTransaction = async (
  req: ITransactionRequest,
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
    const { address } = req.params;

    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const [totalCount, transactions] = await Promise.all([
      prisma.transaction.count({
        where: {
          from: address,
        },
      }),
      prisma.transaction.findMany({
        where: {
          from: address,
        },
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!transactions || transactions.length <= 0) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    const totalPages = Math.ceil(totalCount / parsedLimit);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: transactions,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.TRANSACTION_RETRIEVED
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
 * This function handles the API call for find transaction data by method type with pagination
 * methods [TRANSACTION_METHODS.PURCHASE_NFT,TRANSACTION_METHODS.LIST_NFT,TRANSACTION_METHODS.BID_NFT]
 *
 * @param {ITransactionRequest} req - req transaction id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const getAllTransactionByMethod = async (
  req: ITransactionRequest,
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
    const { methods } = req.body;

    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const [totalCount, transactions] = await Promise.all([
      prisma.transaction.count({
        where: {
          method: methods ? { in: methods } : undefined,
        },
      }),
      prisma.transaction.findMany({
        where: {
          method: methods ? { in: methods } : undefined,
        },
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!transactions || transactions.length <= 0) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    const totalPages = Math.ceil(totalCount / parsedLimit);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: transactions,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.TRANSACTION_RETRIEVED
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
 * This function handles the API call for find transaction data by  puchase method with pagination
 *
 * @param {ITransactionRequest} req - req transaction id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const getAllTransactionByPurchase = async (
  req: ITransactionRequest,
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

    const [totalCount, transactions] = await Promise.all([
      prisma.transaction.count({
        where: {
          method: TRANSACTION_METHODS.PURCHASE_NFT,
        },
      }),
      prisma.transaction.findMany({
        where: {
          method: TRANSACTION_METHODS.PURCHASE_NFT,
        },
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!transactions || transactions.length <= 0) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    const totalPages = Math.ceil(totalCount / parsedLimit);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: transactions,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.TRANSACTION_RETRIEVED
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

export const createClaimTransaction = async (
  req: ITransactionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }

    const { tx, chain } = req.body;

    const mappedChain = platformChainsByIds[chain] as PlatformChains;

    const { transaction, method } = await verifyClaim({
      tx,
      chain: mappedChain,
    });

    await prisma.transaction.create({
      data: {
        method,
        txHash: transaction.hash,
        contractAddress: transaction.to,
        price: Number(toEther(transaction.value)),
        blockNumber: Number(transaction.blockNumber),
        blockHash: transaction.blockHash,
        to: transaction.to,
        from: transaction.from,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),

        cumulativeGasUsed: null,
        txnFee: null,
        tokenId: null,
        gasPrice: transaction.gasPrice ? Number(transaction.gasPrice) : null,
        gasUsed: transaction.gas ? Number(transaction.gas) : null,
      },
    });

    // if (!transactions || transactions.length <= 0) {
    //   return ERROR_RESPONSE(
    //     res,
    //     false,
    //     HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
    //     MESSAGES.RESULT_NOT_FOUND
    //   );
    // }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      null,
      VALIDATION_MESSAGES.TRANSACTION_RETRIEVED
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

export const getAllGroupedTransaction = async (
  req: ITransactionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    const { method, from } = req.query;

    const groupedTransactions = await prisma.transaction.groupBy({
      by: ["contractAddress"],
      _count: {
        _all: true,
      },
      where: {
        method: method ? method : undefined,
        from: from ? from : undefined,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        groupedTransactions,
      },
      VALIDATION_MESSAGES.TRANSACTION_RETRIEVED
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
