import { Response, NextFunction } from "express";
import prisma from "../common/prisma-client";
import {
  HTTP_STATUS_CODE,
  REQUEST_METHOD,
  MESSAGES,
  VALIDATION_MESSAGES,
} from "../common/constants";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "../helpers/responseHelpers";

import { logger } from "../helpers/loggers";
import { IDocumentRequest } from "src/helpers/Interface";

/**
 * This function handles the API call for showing all top application list
 *
 * @param {ICollectionRequest} req - express request
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllDocumentLists = async (
  req: IDocumentRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const documents = await prisma.vestaDocument.findMany({
      where: {},
      orderBy: { createdAt: "desc" },
    });

    if (!documents || documents.length <= 0) {
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
      {
        data: documents,
      },
      VALIDATION_MESSAGES.DOCUMENT_RETRIEVED
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
 * Handles the API call for create application.
 *
 * @param {IDocumentRequest} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<Response>} A response object containing a status, data, and message.
 */
export const createDocument = async (
  req: IDocumentRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }

    const { title, url, size } = req.body;

    const userID: any = req.user?.id ? req.user.id : undefined;

    const documents = await prisma.vestaDocument.create({
      data: {
        title,
        url,
        size,
        userId: userID,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
      documents,
      VALIDATION_MESSAGES.CREATE_DOCUMENT
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
 * Handles the API call for updating application.
 *
 * @param {IDocumentRequest} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<Response>} A response object containing a status, data, and message.
 */

export const updateDocument = async (
  req: IDocumentRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.PATCH) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.PATCH} Allowed`
      );
    }

    const { title, url, size } = req.body;

    const { id } = req.params;

    const documents = await prisma.vestaDocument.update({
      where: {
        id: parseInt(id),
      },
      data: {
        title,
        url,
        size,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      documents,
      VALIDATION_MESSAGES.UPDATE_DOCUMENT
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
 * Handles the API call for deleting application.
 *
 * @param {IDocumentRequest} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<Response>} A response object containing a status, data, and message.
 */

export const deleteDocument = async (
  req: IDocumentRequest,
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

    const documents = await prisma.vestaDocument.delete({
      where: {
        id: parseInt(id),
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      documents,
      VALIDATION_MESSAGES.DELETE_DOCUMENT
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
