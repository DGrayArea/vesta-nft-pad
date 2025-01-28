import { Response } from "express";
import { ErrorType, Prisma } from "@prisma/client";

import { IErrorLogsRequest } from "../helpers/Interface";
import prisma from "../common/prisma-client";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "../helpers/responseHelpers";
import { HTTP_STATUS_CODE } from "../common/constants";

export const getErrorLogs = async (req: IErrorLogsRequest, res: Response) => {
  try {
    const { page, limit, search, filter: errorTypeFilter } = req.query;
    const parsedPage = parseInt(page as string) || 1;
    const parsedLimit = parseInt(limit as string) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    let typeFilter: ErrorType | null = null;
    if (errorTypeFilter) {
      if (errorTypeFilter === "transaction") typeFilter = ErrorType.TRANSACTION;
      if (errorTypeFilter === "wallet") typeFilter = ErrorType.CONNECT_WALLET;
    }

    const filter: Prisma.ErrorLogsWhereInput = {
      url: search
        ? {
            contains: search,
            mode: "insensitive",
          }
        : undefined,
      type: typeFilter ? typeFilter : undefined,
    };

    const [logs, count] = await Promise.all([
      prisma.errorLogs.findMany({
        where: { ...filter },
        skip,
        take: parsedLimit,
        orderBy: {
          timestamp: "desc",
        },
      }),
      prisma.errorLogs.count({ where: filter }),
    ]);

    const totalPages = Math.ceil(count / parsedLimit);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: logs,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: count,
          resultsPerPage: parsedLimit,
        },
      },
      "Error logs retrieved."
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
