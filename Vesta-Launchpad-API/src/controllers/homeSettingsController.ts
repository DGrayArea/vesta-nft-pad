import { Response, NextFunction } from "express";
import prisma from "../common/prisma-client";
import {
  HTTP_STATUS_CODE,
  MESSAGES,
  REQUEST_METHOD,
  VALIDATION_MESSAGES,
} from "../common/constants";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "../helpers/responseHelpers";
import { IApplicationRequest, ICollectionRequest } from "../helpers/Interface";
import { logger } from "../helpers/loggers";

// collection settings controller

/**
 * This function handles the API call for showing all featured collection data with pagination
 *
 * @param {ICollectionRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllFeaturedCollections = async (
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
    const { page, limit } = req.query;
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const [totalCount, collections] = await Promise.all([
      prisma.displayHomeFeaturedCollection.count({
        where: { isFeatured: true },
      }),
      prisma.displayHomeFeaturedCollection.findMany({
        where: { isFeatured: true },
        skip,
        take: parsedLimit,
        orderBy: { orderNumber: "asc" },
        include: {
          collection: {
            include: {
              application: true,
            },
          },
        },
      }),
    ]);

    // Check if there are no top collections
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
 * This function handles the API call for showing all collection data with pagination
 *
 * @param {ICollectionRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllTopCollections = async (
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
    const { page, limit } = req.query;
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const [totalCount, collections] = await Promise.all([
      prisma.displayHomeTopCollection.count({
        where: { isTopCollection: true },
      }),
      prisma.displayHomeTopCollection.findMany({
        where: { isTopCollection: true },
        skip,
        take: parsedLimit,
        orderBy: { orderNumber: "asc" },
        include: {
          collection: {
            include: {
              application: true,
            },
          },
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

export const createTopCollection = async (
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

    const { isTopCollection, collectionID } = req.body;

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

    const isCollectionStats = await prisma.displayHomeTopCollection.findUnique({
      where: { collectionId: collectionID },
    });

    if (isCollectionStats) {
      const collection = await prisma.displayHomeTopCollection.update({
        where: { id: isCollectionStats.id },
        data: {
          collectionId: collectionID,
          isTopCollection: isTopCollection,
        },
      });

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        collection,
        VALIDATION_MESSAGES.UPDATE_COLLECTION
      );
    }

    const collection = await prisma.displayHomeTopCollection.create({
      data: {
        collectionId: collectionID,
        isTopCollection: isTopCollection,
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

export const createFeaturedCollection = async (
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

    const { isFeaturedCollection, collectionID } = req.body;

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

    const isCollectionStats =
      await prisma.displayHomeFeaturedCollection.findUnique({
        where: { collectionId: collectionID },
      });

    if (isCollectionStats) {
      const collection = await prisma.displayHomeFeaturedCollection.update({
        where: { id: isCollectionStats.id },
        data: {
          collectionId: collectionID,
          isFeatured: isFeaturedCollection,
        },
      });

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        collection,
        VALIDATION_MESSAGES.UPDATE_COLLECTION
      );
    }

    const collection = await prisma.displayHomeFeaturedCollection.create({
      data: {
        collectionId: collectionID,
        isFeatured: isFeaturedCollection,
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

export const updateTopCollectionById = async (
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
    const topCollectionID = parseInt(id);

    const { isTopCollection, collectionID } = req.body;

    const isTop = await prisma.displayHomeTopCollection.findUnique({
      where: { id: topCollectionID },
    });

    if (!isTop) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "Invalid Top Collection"
      );
    }

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

    const updateCollection = await prisma.displayHomeTopCollection.update({
      where: { collectionId: collectionID },
      data: {
        isTopCollection: isTopCollection,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updateCollection,
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

export const updateFeaturedCollectionById = async (
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
    const featuredID = parseInt(id);

    const { isFeaturedCollection, collectionID } = req.body;

    const isFeatured = await prisma.displayHomeFeaturedCollection.findUnique({
      where: { id: featuredID },
    });

    if (!isFeatured) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "Invalid Featured Collection"
      );
    }

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

    const updateCollection = await prisma.displayHomeFeaturedCollection.update({
      where: { collectionId: collectionID },
      data: {
        isFeatured: isFeaturedCollection,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updateCollection,
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

export const updateFeaturedCollectionOrder = async (
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

    const { collectionOrders } = req.body;

    // Validate the array
    if (!Array.isArray(collectionOrders)) {
      throw new Error("Invalid collectionOrders format");
    }
    // example :-
    // collectionOrders = [
    //   {
    //   collectionId
    //   isFeatured
    //   ordernumber
    //   }
    //   {
    //   collectionId
    //   isFeatured
    //   ordernumber
    //   }
    //   ]
    const updatedCollections: any = [];

    for (const collection of collectionOrders) {
      const isCollection = await prisma.collection.findUnique({
        where: { id: collection?.collectionId },
      });

      if (!isCollection) {
        return ERROR_RESPONSE(
          res,
          false,
          HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
          VALIDATION_MESSAGES.INVALID_COLLECTION
        );
      }

      const updateCollection =
        await prisma.displayHomeFeaturedCollection.update({
          where: { collectionId: collection?.collectionId },
          data: {
            isFeatured: collection?.isFeaturedCollection,
            orderNumber: collection?.orderNumber,
          },
        });
      updatedCollections.push(updateCollection);
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updatedCollections,
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

export const updateTopCollectionOrder = async (
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

    const { collectionOrders } = req.body;

    // Validate the array
    if (!Array.isArray(collectionOrders)) {
      throw new Error("Invalid collectionOrders format");
    }

    const updatedCollections: any = [];

    for (const collection of collectionOrders) {
      const isCollection = await prisma.collection.findUnique({
        where: { id: collection?.collectionId },
      });

      if (!isCollection) {
        return ERROR_RESPONSE(
          res,
          false,
          HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
          VALIDATION_MESSAGES.INVALID_COLLECTION
        );
      }

      const updateCollection = await prisma.displayHomeTopCollection.update({
        where: { collectionId: collection?.collectionId },
        data: {
          isTopCollection: collection?.isTopCollection,
          orderNumber: collection?.orderNumber,
        },
      });

      updatedCollections.push(updateCollection);
    }

    // Return the updated collections in the response
    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updatedCollections,
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

// application settings controller

/**
 * This function handles the API call for showing all top application data with pagination
 *
 * @param {IApplicationRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllTopLaunchPadApplication = async (
  req: IApplicationRequest,
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

    const [totalCount, application] = await Promise.all([
      prisma.displayHomeLaunchPadApplication.count({
        where: { isLaunchPad: true },
      }),
      prisma.displayHomeLaunchPadApplication.findMany({
        where: { isLaunchPad: true },
        skip,
        take: parsedLimit,
        orderBy: { orderNumber: "asc" },
        include: {
          application: true,
        },
      }),
    ]);

    if (!application || application.length <= 0) {
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
        data: application,
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
 * This function handles the API call for showing all application creators data with pagination
 *
 * @param {IApplicationRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllApplicationCretors = async (
  req: IApplicationRequest,
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

    const [totalCount, application] = await Promise.all([
      prisma.displayHomeCreatorApplication.count({
        where: { isCreator: true },
      }),
      prisma.displayHomeCreatorApplication.findMany({
        where: { isCreator: true },
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
        include: {
          application: {
            select: {
              applicationUUID: true,
              users: {
                select: {
                  address: true,
                  email: true,
                  fname: true,
                  lname: true,
                  birthDate: true,
                  city: true,
                  country: true,
                  profileImage: true,
                  postalCode: true,
                },
              },
            },
          },
        },
      }),
    ]);

    if (!application || application.length <= 0) {
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
        data: application,
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

export const createTopLaunchpadApplication = async (
  req: IApplicationRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }

    const { isLaunchPad, applicationID } = req.body;

    const isApplication = await prisma.application.findUnique({
      where: { id: applicationID },
    });

    if (!isApplication) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );
    }

    const isApplicationStats =
      await prisma.displayHomeLaunchPadApplication.findUnique({
        where: { applicationId: applicationID },
      });

    if (isApplicationStats) {
      const application = await prisma.displayHomeLaunchPadApplication.update({
        where: { id: isApplicationStats.id },
        data: {
          applicationId: applicationID,
          isLaunchPad: isLaunchPad,
        },
      });

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        application,
        VALIDATION_MESSAGES.UPDATE_APPLICATION
      );
    }

    const application = await prisma.displayHomeLaunchPadApplication.create({
      data: {
        applicationId: applicationID,
        isLaunchPad: isLaunchPad,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      application,
      "Launchpad Application Created Successfully"
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

export const createCreatorApplication = async (
  req: IApplicationRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }

    const { isCreator, applicationID } = req.body;

    const isApplication = await prisma.application.findUnique({
      where: { id: applicationID },
    });

    if (!isApplication) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );
    }

    const isApplicationStats =
      await prisma.displayHomeCreatorApplication.findUnique({
        where: { applicationId: applicationID },
      });

    if (isApplicationStats) {
      const application = await prisma.displayHomeCreatorApplication.update({
        where: { id: isApplicationStats.id },
        data: {
          applicationId: applicationID,
          isCreator: isCreator,
        },
      });

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        application,
        VALIDATION_MESSAGES.UPDATE_APPLICATION
      );
    }

    const application = await prisma.displayHomeCreatorApplication.create({
      data: {
        applicationId: applicationID,
        isCreator: isCreator,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      application,
      "Creator Application Created Successfully"
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

export const updateLaunchpadApplicationnOrder = async (
  req: IApplicationRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.PATCH) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.PATCH} Allowed`
      );
    }

    const { applicationOrders } = req.body;

    // Validate the array
    if (!Array.isArray(applicationOrders)) {
      throw new Error("Invalid applicationOrders format");
    }
    // example :-
    // applicationOrders = [
    //   {
    //   applicationId
    //   isLaunchPad
    //   ordernumber
    //   }
    //   {
    //   applicationId
    //   isLaunchPad
    //   ordernumber
    //   }
    //   ]
    const updatedApplications: any = [];

    for (const application of applicationOrders) {
      const isApplication = await prisma.application.findUnique({
        where: { id: application?.applicationID },
      });

      if (!isApplication) {
        return ERROR_RESPONSE(
          res,
          false,
          HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
          VALIDATION_MESSAGES.INVALID_APPLICATION
        );
      }

      const updatApplication =
        await prisma.displayHomeLaunchPadApplication.update({
          where: { applicationId: application?.applicationID },
          data: {
            isLaunchPad: application?.isLaunchPad,
            orderNumber: application?.orderNumber,
          },
        });
      updatedApplications.push(updatApplication);
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updatedApplications,
      "Launchpad Application Updated Successfully"
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

export const updateCreatorApplicationOrder = async (
  req: IApplicationRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.PATCH) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.PATCH} Allowed`
      );
    }

    const { applicationOrders } = req.body;
    // Validate the array
    if (!Array.isArray(applicationOrders)) {
      throw new Error("Invalid applicationOrders format");
    }
    // example :-
    // applicationOrders = [
    //   {
    //   applicationId
    //   isCreator
    //   ordernumber
    //   }
    //   {
    //   applicationId
    //   isCreator
    //   ordernumber
    //   }
    //   ]

    const updatedApplications: any = [];
    for (const application of applicationOrders) {
      const isApplication = await prisma.application.findUnique({
        where: { id: application?.applicationID },
      });

      if (!isApplication) {
        return ERROR_RESPONSE(
          res,
          false,
          HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
          VALIDATION_MESSAGES.INVALID_APPLICATION
        );
      }

      const updateApplication =
        await prisma.displayHomeCreatorApplication.update({
          where: { applicationId: application?.applicationID },
          data: {
            isCreator: application?.isCreator,
            orderNumber: application?.orderNumber,
          },
        });
      updatedApplications.push(updateApplication);
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updatedApplications,
      "Creator Application Updated Successfully"
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

export const updateTopLaunchPadApplicationById = async (
  req: IApplicationRequest,
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
    const topLaunchPadID = parseInt(id);

    const { isLaunchPad, applicationID } = req.body;

    const isTopLaunchpadCollection =
      await prisma.displayHomeLaunchPadApplication.findUnique({
        where: { id: topLaunchPadID },
      });

    if (!isTopLaunchpadCollection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "Invalid Top Launchpad Application"
      );
    }

    const isApplication = await prisma.application.findUnique({
      where: { id: applicationID },
    });

    if (!isApplication) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );
    }

    const updateCollection =
      await prisma.displayHomeLaunchPadApplication.update({
        where: { applicationId: applicationID },
        data: {
          isLaunchPad: isLaunchPad,
        },
      });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updateCollection,
      "Launchpad Application Updated Successfully"
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

export const updateCreatorApplicationById = async (
  req: IApplicationRequest,
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
    const creatorID = parseInt(id);

    const { isCreator, applicationID } = req.body;

    const isCreatorCollection =
      await prisma.displayHomeCreatorApplication.findUnique({
        where: { id: creatorID },
      });

    if (!isCreatorCollection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "Invalid Featured Collection"
      );
    }

    const isCollection = await prisma.application.findUnique({
      where: { id: applicationID },
    });

    if (!isCollection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );
    }

    const updateCollection = await prisma.displayHomeCreatorApplication.update({
      where: { applicationId: applicationID },
      data: {
        isCreator: isCreator,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updateCollection,
      "Creator Application Updated Successfully"
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

// upcoming mints settings controller

/**
 * This function handles the API call for showing all upcoming mints data with pagination
 *
 * @param {IApplicationRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllUpcomingMints = async (
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
    const { page, limit } = req.query;
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;
    const currentDateTime = new Date();

    const [totalCount, upcomingMints] = await Promise.all([
      prisma.displayHomeUpcomingMint.count({
        where: {
          collection: {
            openDate: {
              gt: currentDateTime, // Filter collections with openDate greater than currentDateTime
            },
          },
          isUpComing: true,
        },
      }),
      prisma.displayHomeUpcomingMint.findMany({
        where: {
          collection: {
            openDate: {
              gt: currentDateTime, // Filter collections with openDate greater than currentDateTime
            },
          },
          isUpComing: true,
        },
        skip,
        take: parsedLimit,
        orderBy: { orderNumber: "asc" },
        include: {
          collection: {
            include: {
              application: true,
            },
          },
        },
      }),
    ]);

    if (!upcomingMints || upcomingMints.length <= 0) {
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
        data: upcomingMints,
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

export const createUpcomingMint = async (
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

    const { isUpComing, collectionID } = req.body;

    const isCollection = await prisma.collection.findUnique({
      where: { id: collectionID },
    });

    if (!isCollection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );
    }

    const isCollectionStats = await prisma.displayHomeUpcomingMint.findUnique({
      where: { collectionId: collectionID },
    });

    if (isCollectionStats) {
      const application = await prisma.displayHomeUpcomingMint.update({
        where: { id: isCollectionStats.id },
        data: {
          collectionId: collectionID,
          isUpComing: isUpComing,
        },
      });

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        application,
        VALIDATION_MESSAGES.UPDATE_APPLICATION
      );
    }

    const collection = await prisma.displayHomeUpcomingMint.create({
      data: {
        collectionId: collectionID,
        isUpComing: isUpComing,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      collection,
      "Upcoming Mint Created Successfully"
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

export const updateUpcomingMintOrder = async (
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

    const { mintOrders } = req.body;

    // Validate the array
    if (!Array.isArray(mintOrders)) {
      throw new Error("Invalid mintOrders format");
    }
    // example :-
    // mintOrders = [
    //   {
    //   collectionId
    //   isUpComing
    //   ordernumber
    //   }
    //   {
    //   collectionId
    //   isUpComing
    //   ordernumber
    //   }
    //   ]
    const updatedUpcomingMints: any = [];

    for (const mint of mintOrders) {
      const isCollection = await prisma.collection.findUnique({
        where: { id: mint?.collectionID },
      });

      if (!isCollection) {
        return ERROR_RESPONSE(
          res,
          false,
          HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
          VALIDATION_MESSAGES.INVALID_COLLECTION
        );
      }

      const updateCollection = await prisma.displayHomeUpcomingMint.update({
        where: { collectionId: mint?.collectionID },
        data: {
          isUpComing: mint?.isUpcoming,
          orderNumber: mint?.orderNumber,
        },
      });
      updatedUpcomingMints.push(updateCollection);
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updatedUpcomingMints,
      "Upcoming Mint Updated Successfully"
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

export const updateUpcomingMintById = async (
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
    const upcomingMintID = parseInt(id);

    const { isUpComing, collectionID } = req.body;

    const isUpComingMint = await prisma.displayHomeUpcomingMint.findUnique({
      where: { id: upcomingMintID },
    });

    if (!isUpComingMint) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "Invalid Upcoming Mint"
      );
    }

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

    const updateCollection = await prisma.displayHomeUpcomingMint.update({
      where: { collectionId: collectionID },
      data: {
        isUpComing: isUpComing,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updateCollection,
      "Upcoming Mint Updated Successfully"
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
