import { SalesData } from "./../helpers/Interface";
import { Response, NextFunction } from "express";
import {
  Collection,
  CollectionSales,
  CollectionStatus,
  Prisma,
} from "@prisma/client";

import { ICollectionRequest } from "../helpers/Interface";
import prisma from "../common/prisma-client";
import {
  HTTP_STATUS_CODE,
  REQUEST_METHOD,
  MESSAGES,
  VALIDATION_MESSAGES,
} from "../common/constants";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "../helpers/responseHelpers";
import { getContractDeployEventLogs } from "../helpers/eventLogs";
import { logger } from "../helpers/loggers";
import { addArrayConditionToWhereClause, generateSlug } from "../helpers/utils";
import config from "../config/serverConfig";
import { cloudlog } from "../helpers/cloudwatchLogger";
import {
  getCollectionUniqueOwnersCount,
  getNFTsForContract,
} from "../helpers/getNFtsFromProvider";
import { Roles } from "@/middlewares/roleGuardMiddleware";
import { CollectionSortOptions } from "@/common/enums/CollectionSortOptions";
import { sendCollectoinVerficationEmails } from "@/helpers/sendgrid";
import { getWalletAddressesFromExcel } from "@/helpers/excel";
import { deployOnApproval } from "@/helpers/thirdweb";

/**
 * This function handles the API call for showing all top collection data with pagination
 *
 * @param {ICollectionRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllCollections = async (
  req: ICollectionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }
    const {
      page,
      limit,
      past,
      promoted,
      approved,
      // trending,
      // top
    } = req.query;
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const isPast = past === "true";
    const currentDateTime = new Date();

    const isPromoted = promoted === "true";
    const isApproved = Boolean(approved) === true;

    let collectionFilter: any = {};

    if (isPast) {
      collectionFilter.closeDate = {
        lt: currentDateTime,
      };
    }

    if (isPromoted) {
      collectionFilter.isPromoted = true;
    }

    if (isApproved) {
      collectionFilter.isApproved = true;
    }

    const [totalCount, collections] = await Promise.all([
      prisma.collection.count({ where: collectionFilter }),
      prisma.collection.findMany({
        skip,
        take: parsedLimit,
        where: collectionFilter,
        include: {
          application: true,
          CollectionSales: true,
          // Listing: {
          //   select: {
          //     id: true,
          //     isSold: true,
          //   },
          // },
          // _count: {
          //   select: {
          //     Listing: {
          //       where: { isSold: true },
          //     },
          //   },
          // },
        },
        // orderBy:
        //   trending === "true"
        //     ? [
        //         {
        //           Listing: {
        //             _count: "desc",
        //           },
        //         },
        //       ]
        //     : top === "true"
        //     ? [
        //         {
        //           floorPrice: "desc", // ! this should be (floor price * sales)
        //         },
        //       ]
        //     : [{ createdAt: "desc" }],
      }),
    ]);

    if (!collections || collections.length <= 0) {
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
        data: collections,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.COLLECTION_RETRIEVED
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

export const getCollectionsAll = async (
  req: ICollectionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }
    const { page, limit, sortBy, sortType, search } = req.query;
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;
    console.log("called-collection", page, limit, sortBy, sortType, search);

    const skip = (parsedPage - 1) * parsedLimit;

    const [totalCount, collections] = await Promise.all([
      prisma.collection.count({
        where: {
          name: {
            contains: search ? search : undefined,
          },
        },
      }),
      prisma.collection.findMany({
        skip,
        take: parsedLimit,
        orderBy:
          sortBy && typeof sortBy === "string"
            ? { [sortBy]: sortType ? sortType : "asc" }
            : { createdAt: "desc" },
        where: {
          name: {
            contains: search ? search : undefined,
            mode: "insensitive",
          },
        },
        include: {
          application: true,
          CollectionSales: true,
        },
      }),
    ]);

    if (!collections || collections.length <= 0) {
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
        data: collections,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.COLLECTION_RETRIEVED
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

export const checkIfCollectionNameExist = async (
  req: ICollectionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    const { name } = req.params;

    const isExist = await prisma.collection.count({ where: { name } });

    if (isExist > 0)
      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        false,
        "Collection name is not available"
      );

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      true,
      "Collection name is available"
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

/**
 * This function handles the API call for showing all top collection data with pagination
 *
 * @param {ICollectionRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllCollectionsbyapllication = async (
  req: ICollectionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const { page, limit, past, promoted, sort, search } = req.query;
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;
    const skip = (parsedPage - 1) * parsedLimit;
    const isPast = past === "true";
    const isPromoted = promoted === "true";
    const currentDateTime = new Date();

    let collectionFilter: any = {};
    let orderBy: any = { createdAt: "desc" };

    if (isPast) {
      collectionFilter.closeDate = {
        lt: currentDateTime,
      };
    }

    if (isPromoted) {
      collectionFilter.isPromoted = true;
    }

    if (search) {
      collectionFilter.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Handle sorting using enum
    switch (sort) {
      case CollectionSortOptions.RecentlyAdded:
        orderBy = { createdAt: "desc" };
        break;
      case CollectionSortOptions.HighestFloorPrice:
        orderBy = { floorPrice: "desc" };
        break;
      case CollectionSortOptions.LowestFloorPrice:
        orderBy = { floorPrice: "asc" };
        break;
      case CollectionSortOptions.HighestVolume:
        orderBy = { totalVolume: "desc" };
        break;
      case CollectionSortOptions.LowestVolume:
        orderBy = { totalVolume: "asc" };
        break;
      case CollectionSortOptions.Oldest:
        orderBy = { createdAt: "asc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const [totalCount, collections] = await Promise.all([
      prisma.collection.count({ where: collectionFilter }),
      prisma.collection.findMany({
        skip,
        take: parsedLimit,
        where: collectionFilter,
        orderBy,
        include: {
          application: true,
        },
      }),
    ]);

    if (!collections || collections.length <= 0) {
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
        data: collections,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.COLLECTION_RETRIEVED
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

export const getCollectionsByApplicationID = async (
  req: ICollectionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const {
      page,
      limit,
      past,
      promoted,
      sort,
      search,
      isdeployeventhappend,
      isapproved,
      isbanned,
      ispending,
    } = req.query;
    const parsedPage = page ? parseInt(page) : 1;
    const parsedLimit = limit ? parseInt(limit) : 10;
    const skip = (parsedPage - 1) * parsedLimit;
    const isPast = past === "true";
    const isPromoted = promoted === "true";
    const isDeployEventHappend = isdeployeventhappend === "true";
    const isApproved = isapproved === "true";
    const isBanned = isbanned === "true";

    const isPending = ispending === "true";

    const currentDateTime = new Date();

    const applicationId = Number(req.params.applicationId);

    const collectionFilter: Prisma.CollectionWhereInput = {
      applicationId,
      closeDate: {
        lt: isPast ? currentDateTime : undefined,
      },
      isPromoted: isPromoted ? isPromoted : undefined,
      isDeployEventHappend: isDeployEventHappend
        ? isDeployEventHappend
        : undefined,
      isApproved: isApproved ? isApproved : undefined,
      isBanned: isBanned ? isBanned : undefined,
      isPending: isPending ? isPending : undefined,
      name: {
        contains: search ? search : undefined,
        mode: "insensitive",
      },
    };

    let orderBy: any = { createdAt: "desc" };

    switch (sort) {
      case CollectionSortOptions.RecentlyAdded:
        orderBy = { createdAt: "desc" };
        break;
      case CollectionSortOptions.HighestFloorPrice:
        orderBy = { floorPrice: "desc" };
        break;
      case CollectionSortOptions.LowestFloorPrice:
        orderBy = { floorPrice: "asc" };
        break;
      case CollectionSortOptions.HighestVolume:
        orderBy = { totalVolume: "desc" };
        break;
      case CollectionSortOptions.LowestVolume:
        orderBy = { totalVolume: "asc" };
        break;
      case CollectionSortOptions.Oldest:
        orderBy = { createdAt: "asc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const [totalCount, collections] = await Promise.all([
      prisma.collection.count({ where: collectionFilter }),
      prisma.collection.findMany({
        skip,
        take: parsedLimit,
        where: collectionFilter,
        orderBy,
        include: {
          application: true,
          CollectionSales: true,
        },
      }),
    ]);

    // if (!collections || collections.length <= 0) {
    //   return ERROR_RESPONSE(
    //     res,
    //     false,
    //     HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
    //     MESSAGES.RESULT_NOT_FOUND
    //   );
    // }

    const totalPages = Math.ceil(totalCount / parsedLimit);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: collections,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.COLLECTION_RETRIEVED
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

export const getCollectionsByUUID = async (
  req: ICollectionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const collection = await prisma.collection.findFirst({
      where: {
        collectionUUID: req.params.uuid as string,
      },
      include: {
        CollectionSales: true,
      },
    });

    if (!collection) {
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
      collection,
      VALIDATION_MESSAGES.COLLECTION_RETRIEVED
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

export const getCollectionByContractAddress = async (
  req: ICollectionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const collection = await prisma.collection.findFirst({
      where: {
        contractAddress: req.params.contractAddress as string,
      },
    });

    if (!collection) {
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
      collection,
      VALIDATION_MESSAGES.COLLECTION_RETRIEVED
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

/**
 * This function handles the API call for showing all top collection list
 *
 * @param {ICollectionRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllCollectionsList = async (
  req: ICollectionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const collections = await prisma.collection.findMany({
      where: { isDeploy: true, isApproved: true },
      orderBy: { createdAt: "desc" },
      include: {
        application: true,
      },
    });

    if (!collections || collections.length <= 0) {
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
        data: collections,
      },
      VALIDATION_MESSAGES.COLLECTION_RETRIEVED
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
 * This function handles the API call for showing all upcoming collection list
 *
 * @param {ICollectionRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllUpcomingCollectionsList = async (
  req: ICollectionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const { filter, category, chain } = req.query; // Extract filter from query params
    const currentDateTime = new Date();

    let filterTime: Date | null = null;
    if (filter && ["1h", "6h", "24h", "7d"].includes(filter as string)) {
      switch (filter) {
        case "1h":
          filterTime = new Date(currentDateTime.getTime() + 1 * 60 * 60 * 1000);
          break;
        case "6h":
          filterTime = new Date(currentDateTime.getTime() + 6 * 60 * 60 * 1000);
          break;
        case "24h":
          filterTime = new Date(
            currentDateTime.getTime() + 24 * 60 * 60 * 1000
          );
          break;
        case "7d":
          filterTime = new Date(
            currentDateTime.getTime() + 7 * 24 * 60 * 60 * 1000
          );
          break;
      }
    }

    const upcomingCollections = await prisma.collection.findMany({
      where: {
        isDeploy: true,
        isApproved: true,
        openDate: {
          gt: currentDateTime, // Filter collections with openDate greater than currentDateTime
          ...(filterTime ? { lte: filterTime } : {}),
        },
        category: category ? category : undefined,
        chain: chain ? chain : undefined,
      },
      include: {
        application: true,
      },
    });

    if (!upcomingCollections || upcomingCollections.length <= 0) {
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
        data: upcomingCollections,
      },
      VALIDATION_MESSAGES.COLLECTION_RETRIEVED
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

export const getAllPreviousCollectionsListAlt = async (
  req: ICollectionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const { filter, category, chain, type } = req.query;
    const currentDateTime = new Date();

    let filterTime: Date | null = null;
    if (filter && ["1h", "6h", "24h", "7d"].includes(filter as string)) {
      switch (filter) {
        case "1h":
          filterTime = new Date(currentDateTime.getTime() - 1 * 60 * 60 * 1000);
          break;
        case "6h":
          filterTime = new Date(currentDateTime.getTime() - 6 * 60 * 60 * 1000);
          break;
        case "24h":
          filterTime = new Date(
            currentDateTime.getTime() - 24 * 60 * 60 * 1000
          );
          break;
        case "7d":
          filterTime = new Date(
            currentDateTime.getTime() - 7 * 24 * 60 * 60 * 1000
          );
          break;
      }
    }

    const upcomingCollections = await prisma.collection.findMany({
      where: {
        isDeploy: true,
        isApproved: true,
        openDate: {
          lt: currentDateTime,
          ...(filterTime ? { gte: filterTime } : {}),
        },
        category: category ? category : undefined,
        chain: chain ? chain : undefined,
      },
      include: {
        application: true,
      },
      skip: 0,
      take: 10,
    });

    const collectionsWithVolumes = upcomingCollections.map((col) => {
      const { soldCount, floorPrice } = col;
      return {
        totalVolumeCal:
          soldCount !== null && floorPrice !== null
            ? soldCount * floorPrice
            : 0,
        ...col,
      };
    });

    let result: Collection[] = [];

    if (type === "top") {
      result = collectionsWithVolumes.sort(
        (a, b) => b.totalVolumeCal - a.totalVolumeCal
      );
    }

    if (type === "trending")
      result = collectionsWithVolumes.sort(
        (a, b) => b.soldCount! - a.soldCount!
      );

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      result,
      VALIDATION_MESSAGES.COLLECTION_RETRIEVED
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

export const getActiveAndUpcomingCollection = async (
  req: ICollectionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    const { timeFilter, page, limit, chain, deployed, category } = req.query;

    const parsedPage = page ? parseInt(page) : 1;
    const parsedLimit = limit ? parseInt(limit) : 10;
    const skip = (parsedPage - 1) * parsedLimit;

    const collectionFilter: Prisma.CollectionWhereInput = {
      openDate:
        timeFilter === "past"
          ? {
              lt: new Date(),
            }
          : timeFilter === "active"
          ? {
              lte: new Date(),
            }
          : {
              gte: new Date(),
            },
      closeDate:
        timeFilter === "active"
          ? {
              gte: new Date(),
            }
          : timeFilter === "past"
          ? {
              lt: new Date(),
            }
          : undefined,
      chain: chain ? chain : undefined,
      isApproved: true,
      isDeploy: deployed ? deployed : undefined,
      isDeployEventHappend: deployed ? deployed : undefined,
      category: category ? category : undefined,
    };

    const [totalCount, collections] = await Promise.all([
      prisma.collection.count({
        where: collectionFilter,
      }),
      await prisma.collection.findMany({
        skip,
        take: parsedLimit,
        where: collectionFilter,
        orderBy:
          timeFilter === "past" ? { openDate: "desc" } : { openDate: "asc" },
        include: {
          application: true,
          owner: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / parsedLimit);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: collections,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.COLLECTION_RETRIEVED
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

/**
 * This function handles the API call for showing all collection data with pagination
 *
 * @param {ICollectionRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllDeployedCollections = async (
  req: ICollectionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    const { page, limit, name, category } = req.query;
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    let whereClause: Prisma.CollectionWhereInput = {
      isDeploy: true,
      // isPublish: true,
      // isApproved: true,
      collectionStatus: CollectionStatus.PUBLISHED,
    };

    if (name) {
      addArrayConditionToWhereClause(whereClause, "name", name);
    }
    if (category) {
      addArrayConditionToWhereClause(whereClause, "category", category);
    }
    const [totalCount, collections] = await Promise.all([
      prisma.collection.count({
        where: whereClause,
      }),
      prisma.collection.findMany({
        where: whereClause,
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
        include: {
          application: true,
        },
      }),
    ]);

    if (!collections || collections.length <= 0) {
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
        data: collections,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.COLLECTION_RETRIEVED
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
 * This function handles the API call for get collection data by specific user
 *
 * @param {ICollectionRequest} req - req collection id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const getCollectionByUser = async (
  req: ICollectionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }
    const userID: any = req.user?.id ? req.user.id : undefined;

    const collection = await prisma.collection.findMany({
      where: {
        ownerId: userID,
      },
      include: {
        application: true,
      },
    });

    if (!collection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        VALIDATION_MESSAGES.COLLECTION__NOT_FOUND
      );
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      collection,
      VALIDATION_MESSAGES.COLLECTION_RETRIEVED
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

const getChainFromEnum = (chainEnum: string): string => {
  switch (chainEnum) {
    case "ETHEREUM":
      return "Ethereum";
    case "SOLANA":
      return "Solana";
    case "POLYGON":
      return "Polygon";
    default:
      return "Doge";
  }
};

/**
 * This function handles the API call for find collection data by specific id
 *
 * @param {ICollectionRequest} req - req collection id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const getCollectionByID = async (
  req: ICollectionRequest,
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
    const collectionID = parseInt(id);

    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionID,
      },
      include: {
        application: true,
        CollectionSales: true,
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

    const salesData: SalesData = {
      privateSaleData: null,
      preSaleData: null,
      publicSaleData: null,
    };

    collection.CollectionSales.forEach((sale) => {
      if (sale.saleType === "PRIVATE") {
        salesData.privateSaleData = sale;
      } else if (sale.saleType === "PRE") {
        salesData.preSaleData = sale;
      } else if (sale.saleType === "PUBLIC") {
        salesData.publicSaleData = sale;
      }
    });

    if (salesData.privateSaleData?.chain) {
      salesData.privateSaleData.chain = getChainFromEnum(
        salesData.privateSaleData.chain
      );
    }
    if (salesData.preSaleData?.chain) {
      salesData.preSaleData.chain = getChainFromEnum(
        salesData.preSaleData.chain
      );
    }
    if (salesData.publicSaleData?.chain) {
      salesData.publicSaleData.chain = getChainFromEnum(
        salesData.publicSaleData.chain
      );
    }

    const { CollectionSales, ...responseData } = collection;

    const finalResponseData = {
      ...responseData,
      ...salesData,
    };

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      finalResponseData,
      VALIDATION_MESSAGES.COLLECTION_RETRIEVED
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
 * Handles the API call for create collection.
 *
 * @param {ICollectionRequest} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<Response>} A response object containing a status, data, and message.
 */
export const createCollection = async (
  req: ICollectionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }
    const userID = req.user?.id ? req.user.id : undefined;

    const {
      name,
      symbol,
      description,
      logoImage,
      featuredImage,
      bannerImage,
      baseURL,
      externalUrl,
      openDate,
      price,
      closeDate,
      category,
      saleType,
      chain,
      totalNft,
      minPerWalletLimit,
      maPerxWalletLimit,
      metaData,
      privateSaleData,
      preSaleData,
      publicSaleData,
      applicationUUID,
    } = req.body as ICollectionRequest["body"];

    //example :- metaData = [{key: "key1", value: "value1"}, {key: "key2", value: "value2"}]
    // tokenId
    // name
    // description
    // image
    // imageHash
    // edition
    // date
    // attributes

    const isApplication = await prisma.application.findFirst({
      where: {
        applicationUUID,
      },
    });

    if (!isApplication) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );
    }

    const isCollection = await prisma.collection.findUnique({
      where: {
        name,
      },
    });

    if (isCollection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.COLLECTION_ALREADY_EXIST
      );
    }

    const formattedMetaData =
      metaData?.map((item: any) => ({
        ...item,
        slug: generateSlug(name),
        creatorId: userID,
        date: new Date(), // ! is this okay?? check this....
      })) || [];

    const isBaseURL =
      metaData?.length > 0
        ? `${
            config.backendBaseURL
          }/api/v1/collection/metadata/by/${generateSlug(name)}/`
        : baseURL;

    const results = await prisma.$transaction(async (prisma) => {
      const collection = await prisma.collection.create({
        data: {
          name,
          symbol,
          slug: generateSlug(name),
          description,
          logoImage,
          category,
          featuredImage,
          bannerImage,
          baseURL: isBaseURL,
          externalUrl,
          openDate: new Date(openDate),
          price,
          closeDate: new Date(closeDate),
          saleType,
          chain,
          totalNft,
          minPerWalletLimit,
          maPerxWalletLimit,
          isPublish: false,
          collectionStatus: CollectionStatus.UNDER_REVIEW,
          owner: {
            connect: {
              id: Number(userID),
            },
          },
          application: {
            connect: {
              id: isApplication.id,
            },
          },
          metaDatas: {
            createMany: {
              data: formattedMetaData,
            },
          },
        },
      });

      const salesTransactions: CollectionSales[] = [];

      if (privateSaleData) {
        const { startDate, endDate, whitelistExcel, ...rest } = privateSaleData;
        salesTransactions.push(
          await prisma.collectionSales.create({
            data: {
              saleType: "PRIVATE",
              // chain: getChainEnum(chain),
              startDate: new Date(startDate),
              endDate: new Date(endDate),
              collectionId: collection.id,
              whitelist: whitelistExcel,
              ...rest,
            },
          })
        );
      }
      if (preSaleData) {
        const { startDate, endDate, whitelistExcel, ...rest } = preSaleData;
        salesTransactions.push(
          await prisma.collectionSales.create({
            data: {
              saleType: "PRE",
              // chain: getChainEnum(chain),
              startDate: new Date(startDate),
              endDate: new Date(endDate),
              collectionId: collection.id,
              whitelist: whitelistExcel,
              ...rest,
            },
          })
        );
      }
      if (publicSaleData) {
        const { startDate, endDate, whitelistExcel, ...rest } = publicSaleData;
        salesTransactions.push(
          await prisma.collectionSales.create({
            data: {
              saleType: "PUBLIC",
              // chain: getChainEnum(chain),
              collectionId: collection.id,
              startDate: new Date(startDate),
              endDate: new Date(endDate),
              whitelist: whitelistExcel,
              ...rest,
            },
          })
        );
      }

      await Promise.all(salesTransactions);

      const user = await prisma.users.findUnique({
        where: { id: Number(userID) },
        select: {
          fname: true,
          email: true,
        },
      });

      sendCollectoinVerficationEmails("PENDING", {
        email: user?.email as string,
        username: user?.fname as string,
        collectionUid: collection.collectionUUID as string,
      });

      return collection;
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
      results,
      VALIDATION_MESSAGES.CREATE_COLLECTION
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

// const getChainEnum = (chain: "Ethereum" | "Solana" | "Doge") => {
//   switch (chain) {
//     case "Ethereum":
//       return Chains.ETHEREUM;
//     case "Solana":
//       return Chains.SOLANA;
//     case "Doge":
//       return Chains.DOGE;
//     default:
//       return null;
//   }
// };

/**
 * Handles the API call admin can create collection for user.
 *
 * @param {ICollectionRequest} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<Response>} A response object containing a status, data, and message.
 */
export const createCollectionByAdmin = async (
  req: ICollectionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }

    const {
      name,
      symbol,
      description,
      logoImage,
      featuredImage,
      bannerImage,
      baseURL,
      openDate,
      price,
      closeDate,
      category,
      saleType,
      chain,
      totalNft,
      minPerWalletLimit,
      maPerxWalletLimit,
      metaData,
      userId,
    } = req.body;

    //example :- metaData = [{key: "key1", value: "value1"}, {key: "key2", value: "value2"}]
    // tokenId
    // name
    // description
    // image
    // imageHash
    // edition
    // date
    // attributes

    const isUser = await prisma.users.findFirst({
      where: {
        id: userId,
        status: "APPROVED",
      },
    });

    if (!isUser) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_USER
      );
    }

    const isApplication = await prisma.application.findFirst({
      where: {
        usersId: userId,
      },
    });

    if (!isApplication) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );
    }

    const isCollection = await prisma.collection.findUnique({
      where: {
        name,
      },
    });

    if (isCollection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.COLLECTION_ALREADY_EXIST
      );
    }

    const formattedMetaData =
      metaData?.map((item: any) => ({
        ...item,
        slug: generateSlug(name),
        creatorId: userId,
        date: new Date(item.date),
      })) || [];

    const isBaseURL =
      metaData?.length > 0
        ? `${
            config.backendBaseURL
          }/api/v1/collection/metadata/by/${generateSlug(name)}/`
        : baseURL;

    const collection = await prisma.collection.create({
      data: {
        name,
        symbol,
        slug: generateSlug(name),
        description,
        logoImage,
        category,
        featuredImage,
        bannerImage,
        baseURL: isBaseURL,
        openDate: new Date(openDate),
        price,
        closeDate: new Date(closeDate),
        saleType,
        chain,
        totalNft,
        minPerWalletLimit,
        maPerxWalletLimit,
        owner: {
          connect: {
            id: userId,
          },
        },
        application: {
          connect: {
            id: isApplication.id,
          },
        },
        metaDatas: {
          createMany: {
            data: formattedMetaData,
          },
        },
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
      collection,
      VALIDATION_MESSAGES.CREATE_COLLECTION
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
 * Handles the API call for update the unique owners count of collection.
 * @param {ICollectionRequest} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<Response>} A response object containing a status, data, and message.
 */

export const updateCollectionUniqueOwners = async (
  req: ICollectionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.PATCH) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.PATCH} Allowed`
      );
    }
    const { contractAddress } = req.params;

    const isCollection = await prisma.collection.findUnique({
      where: { contractAddress },
    });

    if (!isCollection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );
    }

    const getOwnersCount = await getCollectionUniqueOwnersCount(
      contractAddress
    );

    if (!getOwnersCount || getOwnersCount == null) {
      logger.error("Error in getCollectionUniqueOwnersCount", getOwnersCount);
    }

    const updateCollectionUniqueOwners = await prisma.collection.update({
      where: { contractAddress: contractAddress },
      data: {
        uniqueOwnersCount: getOwnersCount,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updateCollectionUniqueOwners,
      VALIDATION_MESSAGES.UPDATE_COLLECTION
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
 * This function handles the API call for publish or unpublish the collection by specific id
 *
 * @param {ICollectionRequest} req - req application id
 * @param {ICollectionRequest} req - req body
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const publishOrUnPublishCollection = async (
  req: ICollectionRequest,
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
    const collectionID = parseInt(id);

    const { isPublish } = req.body;

    const isCollection = await prisma.collection.findUnique({
      where: { id: collectionID },
    });

    if (!isCollection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );
    }

    if (
      req.user?.role !== Roles.ADMIN &&
      req.user?.id !== isCollection.ownerId.toString()
    )
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );

    const collection = await prisma.collection.update({
      where: { id: collectionID },
      data: {
        isPublish,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      collection,
      VALIDATION_MESSAGES.UPDATE_COLLECTION
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

export const promoteDemoteCollection = async (
  req: ICollectionRequest,
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
    const collectionID = parseInt(id);

    const { isPromoted } = req.body;

    const isCollection = await prisma.collection.findUnique({
      where: { id: collectionID },
    });

    if (!isCollection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );
    }

    if (
      req.user?.role !== Roles.ADMIN &&
      req.user?.id !== isCollection.ownerId.toString()
    )
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );

    const collection = await prisma.collection.update({
      where: { id: collectionID },
      data: {
        isPromoted,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      collection,
      VALIDATION_MESSAGES.UPDATE_COLLECTION
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
 * This function handles the API call for approve or reject the collection by specific id
 *
 * @param {ICollectionRequest} req - req application id
 * @param {ICollectionRequest} req - req body
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const approveOrRejectCollection = async (
  req: ICollectionRequest,
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
    const collectionID = parseInt(id);

    const { isApproved, isBanned, reason } = req.body;

    const isCollection = await prisma.collection.findUnique({
      where: { id: collectionID },
      include: { application: true },
    });

    if (!isCollection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );
    }

    const collection = await prisma.collection.update({
      where: { id: collectionID },
      data: {
        isApproved,
        isPending: false,
        isBanned,
        reason,
        collectionStatus: isApproved
          ? CollectionStatus.APPROVED
          : CollectionStatus.REJECTED, // is approved required
      },
      include: {
        CollectionSales: true,
        owner: true,
      },
    });

    const user = await prisma.users.findUnique({
      where: { id: collection.ownerId },
      select: {
        fname: true,
        email: true,
      },
    });

    // const isApprovedUpdated = isCollection?.isApproved !== isApproved;
    const isApprovedUpdated =
      isCollection?.collectionStatus !== "APPROVED" &&
      collection.collectionStatus === "APPROVED";
    const isRejectedUpdated =
      isApproved === false && collection.collectionStatus === "REJECTED";

    if (isApprovedUpdated) {
      sendCollectoinVerficationEmails("APPROVED", {
        email: user?.email as string,
        username: user?.fname as string,
        collectionUid: collection.collectionUUID as string,
        applicationUUid: isCollection.application?.applicationUUID as string,
      });
    }
    if (isRejectedUpdated) {
      sendCollectoinVerficationEmails("REJECTED", {
        email: user?.email as string,
        username: user?.fname as string,
        collectionUid: collection.collectionUUID as string,
        applicationUUid: isCollection.application?.applicationUUID as string,
      });
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      collection,
      VALIDATION_MESSAGES.UPDATE_COLLECTION
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
 * This function handles the API call for update collection data by specific id
 *
 * @param {ICollectionRequest} req - req collection id
 * @param {ICollectionRequest} req - req body
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const updateCollection = async (
  req: ICollectionRequest,
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
    const collectionID = parseInt(id);

    const {
      name,
      symbol,
      description,
      category,
      logoImage,
      featuredImage,
      bannerImage,
      baseURL,
      externalUrl,
      openDate,
      price,
      closeDate,
      saleType,
      chain,
      totalNft,
      minPerWalletLimit,
      maPerxWalletLimit,
      privateSaleData,
      preSaleData,
      publicSaleData,
      creatorEarning,
      vestaEarning,
      maxSupply,
      soldCount,
      collectionStatus,
    } = req.body;

    const isCollection = await prisma.collection.findUnique({
      where: { id: collectionID },
    });

    if (!isCollection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );
    }

    if (
      req.user?.role !== Roles.ADMIN &&
      Number(req.user?.id) !== isCollection.ownerId
    ) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );
    }

    const salesTransactions: CollectionSales[] = [];

    await prisma.collectionSales.deleteMany({
      where: {
        collectionId: collectionID,
      },
    });

    if (privateSaleData) {
      const { startDate, endDate, whitelistExcel, id, ...rest } =
        privateSaleData;
      salesTransactions.push(
        await prisma.collectionSales.create({
          data: {
            saleType: "PRIVATE",
            // chain: getChainEnum(chain),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            collectionId: collectionID,
            whitelist: whitelistExcel,
            ...rest,
          },
        })
      );
    }
    if (preSaleData) {
      const { startDate, endDate, whitelistExcel, id, ...rest } = preSaleData;
      salesTransactions.push(
        await prisma.collectionSales.create({
          data: {
            saleType: "PRE",
            // chain: getChainEnum(chain),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            collectionId: collectionID,
            whitelist: whitelistExcel,
            ...rest,
          },
        })
      );
    }
    if (publicSaleData) {
      const { startDate, endDate, whitelistExcel, id, ...rest } =
        publicSaleData;
      salesTransactions.push(
        await prisma.collectionSales.create({
          data: {
            saleType: "PUBLIC",
            // chain: getChainEnum(chain),
            collectionId: collectionID,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            whitelist: whitelistExcel,
            ...rest,
          },
        })
      );
    }

    await Promise.all(salesTransactions);

    const collection = await prisma.collection.update({
      where: { id: collectionID },
      data: {
        name,
        symbol,
        description,
        category,
        logoImage,
        featuredImage,
        bannerImage,
        baseURL,
        externalUrl,
        openDate,
        price,
        closeDate,
        saleType,
        chain,
        totalNft,
        minPerWalletLimit,
        maPerxWalletLimit,
        creatorEarning,
        vestaEarning,
        maxSupply,
        soldCount,
        collectionStatus,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      collection,
      VALIDATION_MESSAGES.UPDATE_COLLECTION
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

//home display collection

export const contractDeploy = async (
  req: ICollectionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    const { txHash } = req.params;

    const eventLogs = await getContractDeployEventLogs(txHash);

    if (!eventLogs) {
      cloudlog.error(" something went wrong with deploy eventLogs");
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "something went wrong with place eventLogs"
      );
    }

    const existingCollection = await prisma.collection.findUnique({
      where: {
        id: eventLogs[0].collectionId,
      },
    });

    if (!existingCollection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "Invalid collection, something went wrong with deploy"
      );
    }

    // await prisma.transaction.create({
    //   data: {
    //     blockHash: eventLogs[0].blockHash,
    //     blockNumber: eventLogs[0].blockNumber,
    //     contractAddress: eventLogs[0].newCollection,
    //     method: TRANSACTION_METHODS.CONTRACT_DEPLOY,
    //     from: eventLogs[0].from,
    //     to: eventLogs[0].to,
    //     tokenId: eventLogs[0].tokenId,
    //     txHash: eventLogs[0].transactionHash,
    //     cumulativeGasUsed: eventLogs[0].cumulativeGasUsed,
    //     gasPrice: eventLogs[0].gasPrice,
    //     gasUsed: eventLogs[0].gasUsed,
    //     price: eventLogs[0].price,
    //     txnFee: eventLogs[0].txnFee,
    //   },
    // });

    if (existingCollection?.isDeployEventHappend) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "already deployed in event listener"
      );
    }
    const updatedCollection = await prisma.collection.update({
      where: { id: existingCollection?.id },
      data: {
        contractAddress: eventLogs[0].newCollection,
        isDeploy: true,
        isDeployEventHappend: true,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updatedCollection,
      VALIDATION_MESSAGES.CONTRACT_DEPLOYED
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
 * This function handles the API call for delete collection data by specific id
 *
 * @param {ICollectionRequest} req - req body
 * @param {ICollectionRequest} req - req collection id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const deleteCollection = async (
  req: ICollectionRequest,
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
    const collectionID = parseInt(id);

    const isCollection = await prisma.collection.findUnique({
      where: {
        id: collectionID,
      },
    });

    if (!isCollection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );
    }

    if (
      req.user?.role !== Roles.ADMIN &&
      Number(req.user?.id) !== isCollection.ownerId
    )
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );

    const collection = await prisma.collection.delete({
      where: { id: collectionID },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      collection,
      VALIDATION_MESSAGES.DELETE_COLLECTION
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

export const getCollectionStats = async (
  req: ICollectionRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const { collectionId } = req.params;
    const collectionID = parseInt(collectionId);

    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionID,
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

    let topOffer = 0,
      vol24h = 0,
      sales24h = 0,
      allListedNfts = 0,
      nftData: any[] = [],
      tokenIds: any[] = [];

    const currentTime = new Date();
    const past24Hours = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);

    const { contractAddress } = collection;

    if (contractAddress) {
      nftData = await getNFTsForContract(contractAddress);
      tokenIds = nftData.map((nft) => nft.tokenId);

      if (nftData.length > 0) {
        const [bids, soldListings, allListings] = await Promise.all([
          prisma.bid.findMany({
            where: { contractAddress, isBid: true },
          }),
          prisma.listing.findMany({
            where: {
              contractAddress,
              isSold: true,
              purchases: {
                createdAt: { gte: past24Hours },
              },
            },
            select: { tokenId: true, price: true },
          }),
          prisma.listing.findMany({
            where: { contractAddress, isListed: true },
            select: { tokenId: true },
          }),
        ]);

        const nftBids = bids.filter((bid) => tokenIds.includes(bid.tokenId));
        topOffer = nftBids.reduce(
          (max, bid) => (bid.amount > max ? bid.amount : max),
          0
        );
        // topOffer = Math.max(topOffer, maxBid);

        const soldNfts = soldListings.filter((list) =>
          tokenIds.includes(list.tokenId)
        );

        sales24h = soldNfts.length;
        vol24h = soldNfts.reduce((sum, listing) => sum + listing.price, 0);

        allListedNfts = allListings.filter((listing) =>
          tokenIds.includes(listing.tokenId)
        ).length;
      }
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        floorPrice: collection.floorPrice,
        topOffer,
        vol24h,
        sales24h,
        avgSale: vol24h / sales24h,
        allListedNfts,
        suuply: nftData.length, // all minted for collection
        allVol: 0, // ! check this
      },
      VALIDATION_MESSAGES.STATS_COLLECTION_SUCCESS
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

export const getCollectionWithSaleLimitation = async (
  req: ICollectionRequest,
  res: Response
) => {
  try {
    const { contractAddress } = req.params;

    if (!req.user)
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        "User token is missing"
      );

    const { id: userId } = req.user;

    const collection = await prisma.collection.findUnique({
      where: {
        contractAddress,
      },
      include: {
        CollectionSales: true,
      },
    });

    if (!collection)
      return ERROR_RESPONSE(res, false, 404, "Collections not found");

    if (collection?.CollectionSales?.length === 0)
      return ERROR_RESPONSE(
        res,
        false,
        404,
        "Collections does not have any sales data"
      );

    const collectionSalesWithLimitations = await Promise.all(
      collection?.CollectionSales?.map(async (sale) => {
        const { saleType, whitelist, startDate, endDate } = sale;

        if (saleType !== "PUBLIC") {
          return {
            isAllowed: whitelist
              ? await checkIsAllowed(
                  whitelist,
                  await getWalletAddressOfUser(userId)
                )
              : false,
            isActive: checkIsActive(startDate, endDate),
            ...sale,
          };
        } else {
          return {
            isAllowed: true,
            isActive: checkIsActive(startDate, endDate),
            ...sale,
          };
        }
      }) || []
    );

    const { CollectionSales, ...rest } = collection;

    return SUCCESS_RESPONSE(
      res,
      true,
      200,
      {
        ...rest,
        CollectionSales: collectionSalesWithLimitations,
      },
      "collection retrieved"
    );
  } catch (error) {
    return ERROR_RESPONSE(res, false, 500, error.message);
  }
};

const checkIsAllowed = async (excelLink: string, walletAddresses: string[]) => {
  const addresses = await getWalletAddressesFromExcel(excelLink);

  return walletAddresses.some((address) => addresses.includes(address));
};

const checkIsActive = (openDate: Date, closeDate: Date) => {
  const now = new Date();

  return openDate <= now && closeDate > now;
};

const getWalletAddressOfUser = async (userId: string) => {
  try {
    const wallet = await prisma.linkWallet.findMany({
      where: {
        userId: Number(userId),
      },
    });

    return wallet.map((w) => w.address);
  } catch (error) {
    throw error;
  }
};

export const getCollectionsByContractAddress = async (
  req: ICollectionRequest,
  res: Response
) => {
  try {
    const { contractAddress } = req.params;

    const collection = await prisma.collection.findUnique({
      where: {
        contractAddress,
      },
    });

    if (!collection)
      return ERROR_RESPONSE(res, false, 404, "Collection does not exist.");

    return SUCCESS_RESPONSE(res, true, 200, collection, "collection retrieved");
  } catch (error) {
    return ERROR_RESPONSE(res, false, 500, error.message);
  }
};

export const updateFees = async (
  req: ICollectionRequest,
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
    const collectionID = parseInt(id);

    const { creatorEarning, vestaEarning } = req.body;

    const isCollection = await prisma.collection.findUnique({
      where: { id: collectionID },
    });

    if (!isCollection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );
    }

    if (
      req.user?.role !== Roles.ADMIN &&
      Number(req.user?.id) !== isCollection.ownerId
    ) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );
    }

    const collection = await prisma.collection.update({
      where: { id: collectionID },
      include: { CollectionSales: true, owner: true },
      data: {
        creatorEarning,
        vestaEarning,
      },
    });

    // [plug-in thirdweb]
    // check if this alright | lift up ?
    // should we await / do in background ?

    // const isApproved = collection.isApproved === true;
    // const isPublished = collection.isPublish === true;
    const isApproved = collection.collectionStatus === "APPROVED";
    const isNotDeployed = collection.isDeploy === false;
    const isDeployEventNotHappened = collection.isDeployEventHappend === false;

    const deployable = isApproved && isNotDeployed && isDeployEventNotHappened;

    if (deployable) {
      //
      try {
        // waiting for tx confirmation; otherwise / batching doesnt support
        // need to reduce awaits in [deployOnApproval]

        const result = await deployOnApproval({ collection });

        // transaction ?
        await prisma.collection.update({
          where: { id: collectionID },
          data: {
            contractAddress: result.deployedAddress,
            isDeploy: true,
            isDeployEventHappend: true,
            collectionStatus: CollectionStatus.PUBLISHED,
          },
        });
        //
      } catch (error) {
        console.log(error);
      }
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      collection,
      VALIDATION_MESSAGES.UPDATE_COLLECTION
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
