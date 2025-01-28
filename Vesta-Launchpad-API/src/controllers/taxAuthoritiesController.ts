import {
  HTTP_STATUS_CODE,
  REQUEST_METHOD,
  VALIDATION_MESSAGES,
} from "@/common/constants";
import prisma from "@/common/prisma-client";
import { ITaxRequest } from "@/helpers/Interface";
import { logger } from "@/helpers/loggers";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "@/helpers/responseHelpers";
import { Roles } from "@/middlewares/roleGuardMiddleware";
import { NextFunction, Response } from "express";

export const getTaxAuthority = async (
  req: ITaxRequest,
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

    const taxAuthority = await prisma.taxAuthorities.findFirst({
      where: {
        id: parseInt(id),
      },
    });

    if (!taxAuthority)
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_TAX
      );

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      taxAuthority,
      VALIDATION_MESSAGES.TAX_RETRIEVED
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

export const getTaxAuthorityByApplication = async (
  req: ITaxRequest,
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

    const isApplication = await prisma.application.findFirst({
      where: {
        id: parseInt(id),
      },
    });

    if (!isApplication)
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );

    const { page, limit } = req.query;
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const [totalCount, taxAuthorities] = await Promise.all([
      prisma.taxAuthorities.count({ where: { applicationId: parseInt(id) } }),
      await prisma.taxAuthorities.findMany({
        where: {
          applicationId: parseInt(id),
        },
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!taxAuthorities.length)
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.NO_TAX_EXIST
      );

    const totalPages = Math.ceil(totalCount / parsedLimit);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: taxAuthorities,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.TAX_RETRIEVED
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

export const createTaxAuthority = async (
  req: ITaxRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }

    const { question, answer } = req.body;

    const userID: any = req.user?.id ? req.user.id : undefined;

    const application = await prisma.application.findFirst({
      where: {
        usersId: userID,
      },
    });

    if (!application) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );
    }

    const taxAuthority = await prisma.taxAuthorities.create({
      data: {
        question,
        answer,
        applicationId: application.id,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
      taxAuthority,
      VALIDATION_MESSAGES.CREATE_APPLICATION
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

export const updateTaxAuthority = async (
  req: ITaxRequest,
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

    const { question, answer } = req.body;
    const userId = req.user?.id;

    const isApplication = await prisma.application.findFirst({
      where: { usersId: Number(userId) },
    });

    if (!isApplication) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );
    }

    const isTaxAuthority = await prisma.taxAuthorities.findFirst({
      where: {
        id: Number(id),
      },
    });

    if (!isTaxAuthority) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_TAX
      );
    }

    if (
      req.user?.role !== Roles.ADMIN &&
      isApplication.id !== isTaxAuthority?.applicationId
    )
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );

    const taxAuthority = await prisma.taxAuthorities.update({
      where: {
        id: Number(id),
      },
      data: {
        question,
        answer,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      taxAuthority,
      VALIDATION_MESSAGES.UPDATE_APPLICATION
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

export const deleteTaxAuthority = async (
  req: ITaxRequest,
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

    const userId = req.user?.id;

    const isApplication = await prisma.application.findFirst({
      where: { usersId: Number(userId) },
    });

    if (!isApplication) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );
    }

    const isTaxAuthority = await prisma.taxAuthorities.findFirst({
      where: {
        id: Number(id),
      },
    });

    if (!isTaxAuthority) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_TAX
      );
    }

    if (
      req.user?.role !== Roles.ADMIN &&
      isApplication.id !== isTaxAuthority?.applicationId
    )
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );

    const taxAuthority = await prisma.taxAuthorities.delete({
      where: {
        id: isTaxAuthority.id,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      taxAuthority,
      VALIDATION_MESSAGES.UPDATE_APPLICATION
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
