import { Response } from "express";

import { ICorrectionRequestRequest } from "@/helpers/Interface";
import {
  HTTP_STATUS_CODE,
  REQUEST_METHOD,
  VALIDATION_MESSAGES,
} from "@/common/constants";
import prisma from "@/common/prisma-client";
import { Priority, Prisma } from "@prisma/client";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "@/helpers/responseHelpers";

export const getAllCorrectionRequests = async (
  req: ICorrectionRequestRequest,
  res: Response
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const { page, limit, search, sortBy, sortType } = req.query;

    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const correctionsFilter: Prisma.RequestCorrectionWhereInput = {
      topic: {
        contains: search,
        mode: "insensitive",
      },
      reason: {
        contains: search,
        mode: "insensitive",
      },
      user: {
        fname: {
          contains: search,
          mode: "insensitive",
        },
        lname: {
          contains: search,
          mode: "insensitive",
        },
        email: {
          contains: search,
          mode: "insensitive",
        },
      },
    };

    const validSortFields = [
      "createdAt",
      "topic",
      "reason",
      "user.fname",
      "user.lname",
      "user.email",
      "priority",
      "userEmail",
      "updatedAt",
    ];

    if (sortBy && !validSortFields.includes(sortBy)) {
      throw new Error("Invalid sort field");
    }

    const [totalCount, requests] = await Promise.all([
      prisma.requestCorrection.count({ where: correctionsFilter }),
      prisma.requestCorrection.findMany({
        skip,
        take: parsedLimit,
        where: search ? correctionsFilter : {},
        orderBy: sortBy
          ? sortBy.startsWith("user.")
            ? { user: { [sortBy.split(".")[1]]: sortType || "asc" } }
            : { [sortBy]: sortType ? sortType : "asc" }
          : {
              createdAt: "desc",
            },
        include: {
          user: {
            select: {
              fname: true,
              lname: true,
              email: true,
              id: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / parsedLimit);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: requests,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.REQUEST_CORRECTION_RETRIEVED
    );
  } catch (error) {
    console.error(error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

export const updateRequestCollection = async (
  req: ICorrectionRequestRequest,
  res: Response
) => {
  try {
    if (req.method !== REQUEST_METHOD.PATCH) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.PATCH} Allowed`
      );
    }

    const { id } = req.params;

    const isExist = await prisma.requestCorrection.count({
      where: {
        id: Number(id),
      },
    });

    if (isExist < 1)
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_REQUEST_CORRECTION
      );

    const { reason, priority, topic, status } = req.body as {
      reason?: string;
      priority?: Priority;
      topic?: string;
      status?: string;
    };

    const udatedRequest = await prisma.requestCorrection.update({
      where: {
        id: Number(id),
      },
      data: {
        reason,
        priority,
        topic,
        status,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      udatedRequest,
      VALIDATION_MESSAGES.UPDATE_CORRECTION_REQUEST
    );
  } catch (error) {
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};
