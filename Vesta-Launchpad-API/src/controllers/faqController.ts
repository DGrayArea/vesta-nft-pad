import { Response, NextFunction } from "express";
import prisma from "../common/prisma-client";
import {
  HTTP_STATUS_CODE,
  REQUEST_METHOD,
  MESSAGES,
  VALIDATION_MESSAGES,
} from "../common/constants";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "../helpers/responseHelpers";
import { IFaqRequest } from "../helpers/Interface";
import { logger } from "../helpers/loggers";

/**
 * This function handles the API call for showing all fAQ data with pagination
 *
 * @param {IFaqRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllFaqs = async (
  req: IFaqRequest,
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

    const [totalCount, fAQ] = await Promise.all([
      prisma.fAQ.count({}),
      prisma.fAQ.findMany({
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!fAQ || fAQ.length <= 0) {
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
        data: fAQ,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
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
 * This function handles the API call for find faq data by specific id
 *
 * @param {IFaqRequest} req - req faq id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const getFaqByID = async (
  req: IFaqRequest,
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
    const faqID = parseInt(id);

    const faq = await prisma.fAQ.findUnique({
      where: {
        id: faqID,
      },
    });

    if (!faq) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_FAQ
      );
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      faq,
      VALIDATION_MESSAGES.FAQ_RETRIEVED
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
 * Handles the API call for create faq.
 *
 * @param {IFaqRequest} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<Response>} A response object containing a status, data, and message.
 */
export const createFaq = async (
  req: IFaqRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }

    const { answer, question } = req.body;

    const isFaq = await prisma.fAQ.findFirst({
      where: {
        question,
      },
    });

    if (isFaq) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "this question already exist"
      );
    }

    const faq = await prisma.fAQ.create({
      data: {
        question,
        answer,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
      faq,
      VALIDATION_MESSAGES.CREATE_FAQ
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
 * This function handles the API call for update faq data by specific id
 *
 * @param {IFaqRequest} req - req faq id
 * @param {IFaqRequest} req - req body
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const updateFaq = async (
  req: IFaqRequest,
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
    const faqID = parseInt(id);

    const { question, answer, order } = req.body;

    const isFaq = await prisma.fAQ.findUnique({
      where: { id: faqID },
    });

    if (!isFaq) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_FAQ
      );
    }

    const faq = await prisma.fAQ.update({
      where: { id: faqID },
      data: {
        question,
        answer,
        order,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      faq,
      VALIDATION_MESSAGES.UPDATE_FAQ
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
 * This function handles the API call for delete faq data by specific id
 *
 * @param {IFaqRequest} req - req body
 * @param {IFaqRequest} req - req faq id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const deleteFaq = async (
  req: IFaqRequest,
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
    const faqID = parseInt(id);

    const isFaq = await prisma.fAQ.findUnique({
      where: {
        id: faqID,
      },
    });

    if (!isFaq) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_FAQ
      );
    }

    const faq = await prisma.fAQ.delete({
      where: { id: faqID },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      faq,
      VALIDATION_MESSAGES.DELETE_FAQ
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
