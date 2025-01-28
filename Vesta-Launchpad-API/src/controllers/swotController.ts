import { NextFunction, Response } from "express";

import {
  HTTP_STATUS_CODE,
  REQUEST_METHOD,
  VALIDATION_MESSAGES,
} from "@/common/constants";
import { ISWOTRequest } from "@/helpers/Interface";
import prisma from "@/common/prisma-client";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "@/helpers/responseHelpers";
import { logger } from "@/helpers/loggers";
import { Roles } from "@/middlewares/roleGuardMiddleware";

export const getSWOTByApplication = async (
  req: ISWOTRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const { applicationId } = req.params;

    const application = await prisma.application.findFirst({
      where: {
        id: Number(applicationId),
      },
      select: {
        id: true,
        swotImageURL: true,
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

    if (!application.swotImageURL)
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.NO_SWOT_EXIST
      );

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      application,
      VALIDATION_MESSAGES.APPLICATION_RETRIEVED
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

export const createSWOTUrl = async (
  req: ISWOTRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }

    const { swotImageUrl, applicationId } = req.body;

    const isApplication = await prisma.application.findFirst({
      where: {
        id: applicationId,
      },
    });

    if (!isApplication)
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );

    if (
      req.user?.role !== Roles.ADMIN &&
      req.user?.id !== isApplication.usersId
    )
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );

    const updatedApplication = await prisma.application.update({
      where: {
        id: applicationId,
      },
      data: {
        swotImageURL: swotImageUrl,
      },
      select: {
        id: true,
        swotImageURL: true,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updatedApplication,
      VALIDATION_MESSAGES.CREATE_SWOT
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

export const updateSWOTUrl = async (
  req: ISWOTRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.PATCH) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.PATCH} Allowed`
      );
    }

    const { swotImageUrl } = req.body;
    const { applicationId } = req.params;

    const isApplication = await prisma.application.findFirst({
      where: {
        id: Number(applicationId),
      },
    });

    if (!isApplication)
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );

    if (
      req.user?.role !== Roles.ADMIN &&
      req.user?.id !== isApplication.usersId
    )
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );

    const updatedApplication = await prisma.application.update({
      where: {
        id: Number(applicationId),
      },
      data: {
        swotImageURL: swotImageUrl,
      },
      select: {
        id: true,
        swotImageURL: true,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updatedApplication,
      VALIDATION_MESSAGES.UPDATE_APPLICATION
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

export const deleteSWOT = async (
  req: ISWOTRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.DELETE) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.DELETE} Allowed`
      );
    }

    const { applicationId } = req.params;

    const isApplication = await prisma.application.findFirst({
      where: {
        id: Number(applicationId),
      },
    });

    if (!isApplication)
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );

    if (
      req.user?.role !== Roles.ADMIN &&
      req.user?.id !== isApplication.usersId
    )
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );

    const deleteSWOT = await prisma.application.update({
      where: {
        id: Number(applicationId),
      },
      data: {
        swotImageURL: "",
      },
      select: {
        id: true,
        swotImageURL: true,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      deleteSWOT,
      VALIDATION_MESSAGES.DELETE_SWOT
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
