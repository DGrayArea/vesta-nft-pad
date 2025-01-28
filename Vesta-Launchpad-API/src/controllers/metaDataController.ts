import { NextFunction, Response } from "express";
import { logger } from "../helpers/loggers";
import {
  HTTP_STATUS_CODE,
  REQUEST_METHOD,
  VALIDATION_MESSAGES,
} from "../common/constants";
import prisma from "../common/prisma-client";
import { IMetaDataRequest } from "../helpers/Interface";
import { ERROR_RESPONSE } from "../helpers/responseHelpers";
import { isCheckTokenMinted } from "../helpers/verifyOwnership";

export const getAllMetaDataByCollection = async (
  req: IMetaDataRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const { slug, collectionId } = req.query;
    const cId = collectionId ? parseInt(collectionId as string) : undefined;

    const collection = await prisma.collection.findFirst({
      where: {
        OR: [{ id: cId }, { slug }],
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

    const metaData = await prisma.metaData.findMany({
      where: {
        collectionId: collection.id,
      },
    });

    if (!metaData) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_METADATA
      );
    }
    return res.send(metaData);
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

export const getMetaDataBytokenId = async (
  req: IMetaDataRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const { slug, tokenId } = req.params;

    const collection = await prisma.collection.findFirst({
      where: {
        slug,
      },
    });

    if (!collection || !collection.contractAddress) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );
    }

    const isValid = await isCheckTokenMinted(
      collection.contractAddress!,
      parseInt(tokenId)
    );

    if (!isValid) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        VALIDATION_MESSAGES.TOKEN_NOT_MINTED
      );
    }

    const metaData = await prisma.metaData.findFirst({
      where: {
        slug,
        tokenId: parseInt(tokenId),
      },
    });

    if (!metaData) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_METADATA
      );
    }
    return res.send(metaData);
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
