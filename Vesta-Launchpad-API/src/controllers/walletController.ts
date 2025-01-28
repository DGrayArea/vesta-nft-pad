import { Response, NextFunction } from "express";
import prisma from "../common/prisma-client";
import {
  HTTP_STATUS_CODE,
  REQUEST_METHOD,
  MESSAGES,
  VALIDATION_MESSAGES,
  TOKEN_VALIDATION_MESSAGES,
} from "../common/constants";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "../helpers/responseHelpers";
import { ILinkWalletRequest } from "../helpers/Interface";
import { logger } from "../helpers/loggers";

/**
 * This function handles the API call for showing all meta data with pagination
 *
 * @param {ILinkWalletRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllLinkWallets = async (
  req: ILinkWalletRequest,
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

    const [totalCount, linkWallets] = await Promise.all([
      prisma.linkWallet.count({}),
      prisma.linkWallet.findMany({
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!linkWallets || linkWallets.length <= 0) {
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
        data: linkWallets,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.LINKWALLET_RETRIEVED
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
 * This function handles the API call for find linkWallet data by specific id
 *
 * @param {ILinkWalletRequest} req - req linkWallet id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const getLinkWalletByID = async (
  req: ILinkWalletRequest,
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
    const linkWalletID = parseInt(id);

    const linkWallet = await prisma.linkWallet.findUnique({
      where: {
        id: linkWalletID,
      },
    });

    if (!linkWallet) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_LINKWALLET
      );
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      linkWallet,
      VALIDATION_MESSAGES.LINKWALLET_RETRIEVED
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
 * Handles the API call for create linkWallet.
 *
 * @param {ILinkWalletRequest} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<Response>} A response object containing a status, data, and message.
 */
export const createLinkWallet = async (
  req: ILinkWalletRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }

    const { address, provider, signature } = req.body;

    const userID = req.jwt?.id ? parseInt(req.jwt.id) : undefined;

    const user = await prisma.users.findFirst({
      where: {
        id: userID,
        isPublish: true,
      },
    });

    if (!user) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        TOKEN_VALIDATION_MESSAGES.NO_ACCESS
      );
    }

    // Check if the user already has a default wallet
    const defaultWallet = await prisma.linkWallet.findFirst({
      where: {
        userId: user.id,
        isDefault: true,
      },
    });
    // If defaultWallet exists, isDefault is false, otherwise, it's true
    const isCheckDefault = !defaultWallet;

    const isLinkWallet = await prisma.linkWallet.findUnique({
      where: {
        address,
      },
    });

    if (isLinkWallet) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.LINKWALLET_ALREADY_EXIST
      );
    }

    const linkWallet = await prisma.linkWallet.create({
      data: {
        address,
        isDefault: isCheckDefault,
        provider,
        signature,
        userId: user.id,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
      linkWallet,
      VALIDATION_MESSAGES.CREATE_LINKWALLET
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
 * This function handles the API call for update linkWallet data by specific id
 *
 * @param {ILinkWalletRequest} req - req linkWallet id
 * @param {ILinkWalletRequest} req - req body
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const updateisDefaultLinkWallet = async (
  req: ILinkWalletRequest,
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
    const linkWalletID = parseInt(id);

    const { isDefault } = req.body;

    const isLinkWallet = await prisma.linkWallet.findUnique({
      where: { id: linkWalletID },
    });

    if (!isLinkWallet) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_LINKWALLET
      );
    }
    if (isDefault) {
      // Set the isDefault specified linkWallet to true
      await prisma.linkWallet.updateMany({
        where: {
          NOT: { id: linkWalletID }, // Exclude the specified wallet
          isDefault: true, // Find the existing default wallet
        },
        data: {
          isDefault: false, // Update the existing default wallet to false
        },
      });
    }

    // Update the specified linkWallet's status

    const linkWallet = await prisma.linkWallet.update({
      where: { id: linkWalletID },
      data: {
        isDefault,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      linkWallet,
      VALIDATION_MESSAGES.UPDATE_LINKWALLET
    );
  } catch (error) {
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
 * This function handles the API call for delete linkWallet data by specific id
 *
 * @param {ILinkWalletRequest} req - req body
 * @param {ILinkWalletRequest} req - req linkWallet id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const deleteLinkWallet = async (
  req: ILinkWalletRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.DELETE) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.DELETE} Allowed`
      );
    }
    const { id } = req.params;
    const linkWalletID = parseInt(id);

    const isLinkWallet = await prisma.linkWallet.findUnique({
      where: {
        id: linkWalletID,
      },
    });

    if (!isLinkWallet) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_LINKWALLET
      );
    }

    const linkWallet = await prisma.linkWallet.delete({
      where: { id: linkWalletID },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      linkWallet,
      VALIDATION_MESSAGES.DELETE_LINKWALLET
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
