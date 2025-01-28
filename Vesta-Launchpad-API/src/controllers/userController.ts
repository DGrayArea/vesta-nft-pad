import { Response, NextFunction } from "express";
import prisma from "../common/prisma-client";
import {
  HTTP_STATUS_CODE,
  REQUEST_METHOD,
  MESSAGES,
  TOKEN_VALIDATION_MESSAGES,
  VALIDATION_MESSAGES,
} from "../common/constants";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "../helpers/responseHelpers";
import {
  IPrefferencesRequest,
  IUserRequest,
  IUserRequestData,
  IUserSettingsRequest,
  IWalletRequest,
} from "../helpers/Interface";
import { exclude } from "../helpers/excludeFields";
import bcrypt from "bcrypt";
import { isSignatureValid } from "../helpers/KYCUtils";
import configs from "../config/serverConfig";
import { logger } from "../helpers/loggers";
import { cloudlog } from "../helpers/cloudwatchLogger";
import { sendEmail, sendEmailWithFiles } from "../helpers/utils";
import {
  generateExcel,
  generatePDF,
  generateWord,
} from "../helpers/generatefiles";
import { Prisma, SocialMediaLinks } from "@prisma/client";

/**
 * This function handles the API call for showing all user data with pagination
 * @param {IUserRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllUsers = async (
  req: IUserRequest,
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

    const skip = (parsedPage - 1) * parsedLimit;

    const [totalCount, users] = await Promise.all([
      prisma.users.count({
        where: {
          email: {
            contains: search ? search : undefined,
          },
        },
      }),
      prisma.users.findMany({
        skip,
        take: parsedLimit,
        orderBy: sortBy
          ? { [sortBy]: sortType ? sortType : "asc" }
          : { createdAt: "desc" },
        include: {
          settings: true,
        },
        where: {
          email: {
            contains: search ? search : undefined,
            mode: "insensitive",
          },
        },
      }),
    ]);

    if (!users || users.length <= 0) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    const totalPages = Math.ceil(totalCount / parsedLimit);

    const usersWithExclideFields = users.map((user) =>
      exclude(user, ["password"])
    );
    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: usersWithExclideFields,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.USER_RETRIEVED
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
 * This function handles the API call for showing specific user activities with pagination
 * @param {IUserRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getUserActivities = async (
  req: IUserRequest,
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
    const userID = req.jwt?.id ? parseInt(req.jwt.id) : undefined;

    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;
    //check if the data is exist on db
    const isUser = await prisma.users.findUnique({
      where: { id: userID },
    });
    if (!isUser) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_USER
      );
    }

    const [totalCount, activities] = await Promise.all([
      prisma.userActivity.count({
        where: { userId: userID },
      }),
      prisma.userActivity.findMany({
        where: { userId: userID },
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!activities || activities.length <= 0) {
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
        data: activities,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.USER_RETRIEVED
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
 * This function handles the API call for showing all request correction data with pagination
 * @param {IUserRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllRequestCorrections = async (
  req: IUserRequest,
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

    const [totalCount, requestCorrections] = await Promise.all([
      prisma.requestCorrection.count({}),
      prisma.requestCorrection.findMany({
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      }),
    ]);

    if (!requestCorrections || requestCorrections.length <= 0) {
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
        data: requestCorrections,
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
 * This function handles the API call for showing all user settings data with pagination
 * @param {IUserRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllUserPreferences = async (
  req: IUserRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }
    const { page, limit, updates, maintenance, marketing } = req.query;
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    // search params
    let searchObj = {};
    if (maintenance)
      searchObj = {
        ...searchObj,
        maintenance: maintenance === "true" ? true : false,
      };
    if (marketing)
      searchObj = {
        ...searchObj,
        marketing: marketing === "true" ? true : false,
      };
    if (updates)
      searchObj = { ...searchObj, updates: updates === "true" ? true : false };

    const [totalCount, userPreferences] = await Promise.all([
      prisma.userSettings.count({}),
      prisma.userSettings.findMany({
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              fname: true,
              lname: true,
              email: true,
            },
          },
        },
        where: searchObj,
      }),
    ]);

    const updatedUserPreferences = userPreferences.map((preference) => {
      return {
        id: preference?.id,
        userId: preference?.userId,
        name: preference?.user?.fname + " " + preference?.user?.lname,
        email: preference?.user?.email,
        userPreferences: {
          marketing: preference?.marketing,
          maintenance: preference?.maintenance,
          updates: preference?.updates,
        },
        createdAt: preference?.createdAt,
        updatedAt: preference?.updatedAt,
      };
    });

    if (!updatedUserPreferences || updatedUserPreferences.length <= 0) {
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
        data: updatedUserPreferences,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      MESSAGES.DATA_SUCCESS
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
 * This function handles the API call for showing all active user data with pagination
 * @param {IUserRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllActiveUsers = async (
  req: IUserRequest,
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

    const [totalCount, users] = await Promise.all([
      prisma.users.count({
        where: { isPublish: true },
      }),
      prisma.users.findMany({
        where: { isPublish: true },
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
        include: {
          settings: true,
        },
      }),
    ]);

    if (!users || users.length <= 0) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    const totalPages = Math.ceil(totalCount / parsedLimit);

    const usersWithExclideFields = users.map((user) =>
      exclude(user, ["password"])
    );
    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: usersWithExclideFields,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.USER_RETRIEVED
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
 * This function handles the API call for find user data by specific id
 * @param {IUserRequest} req - req data id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const getUserByID = async (
  req: IUserRequest,
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
    const userID = parseInt(id);

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
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_USER
      );
    }

    const usersWithExclideFields = exclude(user, ["password"]);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      usersWithExclideFields,
      VALIDATION_MESSAGES.USER_RETRIEVED
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
 * This function handles the API call for retrieving a user's profile data
 * @param {IUserRequest} req - req user id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const getProfile = async (
  req: IUserRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const userID = req.jwt?.id ? parseInt(req.jwt.id) : undefined;

    const user = await prisma.users.findFirst({
      where: {
        id: userID,
        isPublish: true,
      },
      include: {
        applications: true,
        collections: true,
        settings: true,
        linkedWallets: true,
        ownedNFTs: true,
        listings: true,
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

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      user,
      VALIDATION_MESSAGES.USER_RETRIEVED
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
 * This function handles the API call for updating a user's profile
 * @param {IUserRequest} req - req user id and req body with updated profile data
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const updateProfile = async (
  req: IUserRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.PATCH) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.PATCH} Allowed`
      );
    }

    const userID = req.jwt?.id ? parseInt(req.jwt.id) : undefined;

    const {
      fname,
      lname,
      email,
      address,
      description,
      birthDate,
      city,
      country,
      postalCode,
      profileImage,
      service,
      employmentStatus,
      sourceOfFunds,
    } = req.body;

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
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_USER
      );
    }

    const updatedUser = await prisma.users.update({
      where: { id: userID },
      data: {
        fname,
        lname,
        email,
        address,
        birthDate,
        description,
        city,
        country,
        postalCode,
        profileImage,
        service,
        employmentStatus,
        sourceOfFunds,
      },
    });

    await prisma.userActivity.create({
      data: {
        userId: userID!,
        activity: "User Profile Updated",
        details: `User Profile Updated. Date: ${new Date().toISOString()}`,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updatedUser,
      VALIDATION_MESSAGES.UPDATE_USER
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
 * This function handles the API call for update password by user
 * @param {IUserRequest} req - req user id
 * @param {IUserRequest} req - req body
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const changePassword = async (
  req: IUserRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.PATCH) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.PATCH} Allowed`
      );
    }

    const userID = req.jwt?.id ? parseInt(req.jwt.id) : undefined;
    const { password, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.PASSWORD_DO_NOT_MATCH
      );
    }
    const isUser = await prisma.users.findUnique({
      where: { id: userID },
    });
    if (!isUser) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_USER
      );
    }
    const hashedPassword: any = isUser?.password;
    const isValidCurrentPassword = await bcrypt.compare(
      password,
      hashedPassword
    );
    if (!isValidCurrentPassword) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_CURRENT_PASSWORD
      );
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.users.update({
      where: { id: userID },
      data: {
        password: hashedNewPassword,
      },
    });

    await prisma.userActivity.create({
      data: {
        userId: userID!,
        activity: "Password Changed",
        details: `Password Changed. New password: Date: ${new Date().toISOString()}`,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      user,
      VALIDATION_MESSAGES.PASSWORD_CHANGE
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
 * This function handles the API call for update user data by specific id
 * @param {IUserRequest} req - req user id
 * @param {IUserRequest} req - req body
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const updateUser = async (
  req: IUserRequest,
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
    const userID = parseInt(id);

    const {
      fname,
      lname,
      email,
      address,
      birthDate,
      city,
      country,
      postalCode,
      profileImage,
      role,
      status,
      description,
      reason,
      service,
      employmentStatus,
      sourceOfFunds,
      isPublish,
    } = req.body;
    //check if the data is exist on db
    const isUser = await prisma.users.findUnique({
      where: { id: userID },
    });
    if (!isUser) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_USER
      );
    }

    const user = await prisma.users.update({
      where: { id: userID },
      data: {
        fname,
        lname,
        email,
        address,
        birthDate,
        city,
        country,
        postalCode,
        profileImage,
        description,
        status,
        reason,
        role,
        service,
        employmentStatus,
        sourceOfFunds,
        isPublish,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      user,
      VALIDATION_MESSAGES.UPDATE_USER
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
 * This function handles the API call for de activate the account
 * @param {IUserSettingsRequest} req - req jwt id
 * @param {IUserSettingsRequest} req - req body
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

// export const deactivateOrActivateAccount = async (
//   req: IUserRequest,
//   res: Response,
//   _: NextFunction
// ) => {
//   try {
//     if (req.method !== REQUEST_METHOD.PATCH) {
//       throw new Error(
//         `Invalid Method Type, Only ${REQUEST_METHOD.PATCH} Allowed`
//       );
//     }

//     const userID = req.jwt?.id ? parseInt(req.jwt.id) : undefined;

//     const { password, isPublish } = req.body;

//     const user = await prisma.users.findFirst({
//       where: {
//         id: userID,
//         isPublish: true,
//       },
//     });

//     if (!user) {
//       return ERROR_RESPONSE(
//         res,
//         false,
//         HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
//         VALIDATION_MESSAGES.INVALID_USER
//       );
//     }
//     const hashedPassword: any = user?.password;
//     const isValidPassword = await bcrypt.compare(password, hashedPassword);

//     if (!isValidPassword) {
//       return ERROR_RESPONSE(
//         res,
//         false,
//         HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
//         VALIDATION_MESSAGES.INVALID_PASSWORD
//       );
//     }

//     // Create the HTML content for the email
//     const HTMLContent = `
//         <p>Account successfully deactivated. Please send an email to ${process.env.ADMIN_EMAIL}, if you want to reactivate your account or if you did not request a deactivation</p>
//       `;

//     const updatedUser = await prisma.users.update({
//       where: { id: userID },
//       data: {
//         isPublish: isPublish,
//       },
//     });

//     // Send email verification code to email
//     await sendEmail(user?.email || "", "Account deactivated!", HTMLContent);

//     await prisma.userActivity.create({
//       data: {
//         userId: userID!,
//         activity: "Account Deactivated",
//         details: `Account Deactivated. Date: ${new Date().toISOString()}`,
//       },
//     });

//     return SUCCESS_RESPONSE(
//       res,
//       true,
//       HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
//       updatedUser,
//       VALIDATION_MESSAGES.UPDATE_USER
//     );
//   } catch (error) {
//     logger.error(error);
//     return ERROR_RESPONSE(
//       res,
//       false,
//       HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
//       error.message
//     );
//   }
// };

export const deactivateOrActivateAccount = async (
  req: IUserRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.PATCH) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.PATCH} Allowed`
      );
    }

    // Check if userID is correctly extracted from JWT
    const userID = req.jwt?.id ? parseInt(req.jwt.id) : undefined;

    if (!userID) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        "User not authenticated"
      );
    }

    const { password, isPublish } = req.body;

    // Find the user by ID
    const user = await prisma.users.findFirst({
      where: {
        id: userID,
      },
    });

    // Log if the user is found or not
    if (!user) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_USER
      );
    }

    const hashedPassword: any = user?.password;
    const isValidPassword = await bcrypt.compare(password, hashedPassword);

    if (!isValidPassword) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_PASSWORD
      );
    }

    // Dynamic HTML content based on isPublish status
    const HTMLContent = isPublish
      ? `<p>Your account has been successfully activated. If you did not request this activation, please contact ${process.env.ADMIN_EMAIL} immediately.</p>`
      : `<p>Your account has been successfully deactivated. Please contact ${process.env.ADMIN_EMAIL} if you want to reactivate your account or if you did not request this deactivation.</p>`;

    const updatedUser = await prisma.users.update({
      where: { id: userID },
      data: {
        isPublish: isPublish,
      },
    });

    // Send email based on activation/deactivation status
    await sendEmail(
      user?.email || "",
      `Account ${isPublish ? "Activated" : "Deactivated"}!`,
      HTMLContent
    );

    await prisma.userActivity.create({
      data: {
        userId: userID,
        activity: isPublish ? "Account Activated" : "Account Deactivated",
        details: `Account ${
          isPublish ? "Activated" : "Deactivated"
        }. Date: ${new Date().toISOString()}`,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updatedUser,
      VALIDATION_MESSAGES.UPDATE_USER
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
 * This function handles the API call for update user news setting
 * @param {IUserSettingsRequest} req - req jwt id
 * @param {IUserSettingsRequest} req - req body
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const updateUserNewsSettings = async (
  req: IUserSettingsRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.PATCH) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.PATCH} Allowed`
      );
    }

    const userID = req.jwt?.id ? parseInt(req.jwt.id) : undefined;

    const { updates, maintenance, marketing } = req.body;

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
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_USER
      );
    }

    const updatedUser = await prisma.userSettings.update({
      where: { userId: userID },
      data: {
        updates,
        maintenance,
        marketing,
      },
    });

    await prisma.userActivity.create({
      data: {
        userId: userID!,
        activity: "News Settings Updated",
        details: `News Settings Updated. Date: ${new Date().toISOString()}`,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updatedUser,
      VALIDATION_MESSAGES.NEWS_SETTINGS
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
 * This function handles the API call to fetch user news setting
 * @param {IUserSettingsRequest} req - req jwt id
 * @param {IUserSettingsRequest} req - req body
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const fetchNewsSettings = async (
  req: IUserSettingsRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const userID = req.jwt?.id ? parseInt(req.jwt.id) : undefined;

    const user = await prisma.userSettings.findFirst({
      where: {
        userId: userID,
      },
    });

    if (!user) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_USER
      );
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      user,
      VALIDATION_MESSAGES.NEWS_SETTINGS
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
 * This function handles the API call for update user terms and condition setting
 * @param {IUserSettingsRequest} req - req jwt id
 * @param {IUserSettingsRequest} req - req body
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const updateUserTermsAndConditionSetting = async (
  req: IUserSettingsRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.PATCH) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.PATCH} Allowed`
      );
    }

    const userID = req.jwt?.id ? parseInt(req.jwt.id) : undefined;

    const { termsAndConditions } = req.body;

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
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_USER
      );
    }

    const updatedUser = await prisma.userSettings.update({
      where: { id: userID },
      data: {
        termsAndConditions,
      },
    });

    await prisma.userActivity.create({
      data: {
        userId: userID!,
        activity: "Terms and Conditions Settings Updated",
        details: `Terms and Conditions Settings Updated. Date: ${new Date().toISOString()}`,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updatedUser,
      VALIDATION_MESSAGES.TERMS_AND_CONDITION_SETTINGS
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
 * This function handles the API call for update user privacy setting
 * @param {IUserSettingsRequest} req - req jwt id
 * @param {IUserSettingsRequest} req - req body
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const updateUserPrivacySetting = async (
  req: IUserSettingsRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.PATCH) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.PATCH} Allowed`
      );
    }

    const userID = req.jwt?.id ? parseInt(req.jwt.id) : undefined;

    const { privacyStatement } = req.body;

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
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_USER
      );
    }

    const updatedUser = await prisma.userSettings.update({
      where: { id: userID },
      data: {
        privacyStatement,
      },
    });

    await prisma.userActivity.create({
      data: {
        userId: userID!,
        activity: "Privacy Settings Updated",
        details: `Privacy Settings Updated. Date: ${new Date().toISOString()}`,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updatedUser,
      VALIDATION_MESSAGES.PRIVACY_SETTINGS
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
 * This function handles the API call for update user account visibility setting
 * @param {IUserSettingsRequest} req - req jwt id
 * @param {IUserSettingsRequest} req - req body
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const updateUserAccountVisibilitySetting = async (
  req: IUserSettingsRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.PATCH) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.PATCH} Allowed`
      );
    }

    const userID = req.jwt?.id ? parseInt(req.jwt.id) : undefined;

    const { accountVisibility } = req.body;

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
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_USER
      );
    }

    const updatedUser = await prisma.userSettings.update({
      where: { id: userID },
      data: {
        accountVisibility,
      },
    });

    await prisma.userActivity.create({
      data: {
        userId: userID!,
        activity: "Account Visibility Settings Updated",
        details: `Account Visibility Settings Updated. Date: ${new Date().toISOString()}`,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      updatedUser,
      VALIDATION_MESSAGES.ACCOUNT_VISIBILITY_SETTINGS
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
 * This function handles the API call for verify the user whom he was saying
 * @param {IUserRequest} req - req body
 * @param {IUserRequest} req - req user id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const KYCVerification = async (
  req: IUserRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    // const { id } = req.params;
    // const userID = parseInt(id);
    const signature = req.header("x-hmac-signature");
    const secret = configs.secret;
    const payload = req.body;
    cloudlog.info("Received a webhook");
    cloudlog.info(
      "Validated signature:",
      isSignatureValid({ signature, secret, payload })
    );
    cloudlog.info("Payload", JSON.stringify(payload, null, 4));
    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      payload,
      VALIDATION_MESSAGES.DELETE_USER
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
 * This function handles the API call for request correction by user
 * @param {IUserRequest} req - req body
 * @param {IUserRequest} req - req user id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const SubmitRequestCorrection = async (
  req: IUserRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }

    const { id } = req.params; // Extracting id from route params
    const { reason } = req.body;

    const user = await prisma.users.findFirst({
      where: {
        id: parseInt(id), // Using the extracted `id`
        isPublish: true,
      },
    });

    if (!user) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_USER
      );
    }

    const requestCorrection = await prisma.requestCorrection.create({
      data: {
        status: "PENDING",
        userId: user.id!, // Use `id` from the users table
        reason,
        userEmail: user.email!, // Add the userEmail here
      },
    });

    await prisma.userActivity.create({
      data: {
        userId: user.id!,
        activity: "Submit Request Correction",
        details: `Request Correction Submitted. Reason: ${reason} Date: ${new Date().toISOString()}`,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      requestCorrection,
      VALIDATION_MESSAGES.REQUEST_CORRECTION_SUBMITTED
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
 * This function handles the API call for update status in specific request correction
 * @param {IUserRequest} req - req body
 * @param {IUserRequest} req - req user id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const StatusOfRequestCorrection = async (
  req: IUserRequest,
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
    const { status } = req.body;

    const isRequestCorrection = await prisma.requestCorrection.findUnique({
      where: { id: parseInt(id) },
    });

    if (!isRequestCorrection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_REQUEST_CORRECTION
      );
    }

    const requestCorrection = await prisma.requestCorrection.update({
      where: { id: parseInt(id) },
      data: {
        status,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      requestCorrection,
      VALIDATION_MESSAGES.REQUEST_CORRECTION_STATUS_UPDATE
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
 * This function handles the API call for request user data to files
 * @param {IUserRequestData} req - req body
 * @param {IUserRequestData} req - req user id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const requestUserData = async (
  req: IUserRequestData,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.PATCH) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.PATCH} Allowed`
      );
    }

    const userID = req.jwt?.id;
    if (!userID) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        "User not authenticated"
      );
    }

    const { email, pdf, excel, doc } = req.body;

    const isUser = await prisma.users.findFirst({
      where: {
        id: userID,
        isPublish: true,
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

    if (isUser.email !== email) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "You are not authorized to access this data. The provided email address does not match the user associated with the request."
      );
    }

    if (!pdf && !excel && !doc) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "No file type selected. Please select at least one file type (PDF, Excel, or Doc)."
      );
    }

    const attachments: any[] = [];

    if (pdf) {
      try {
        const pdfAttachment = await generatePDF(isUser);
        attachments.push(pdfAttachment);
      } catch (error) {
        console.error("Error generating PDF:", error);
        return ERROR_RESPONSE(
          res,
          false,
          HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
          "Failed to generate PDF file."
        );
      }
    }

    if (excel) {
      try {
        const excelAttachment = await generateExcel(isUser);
        attachments.push(excelAttachment);
      } catch (error) {
        console.error("Error generating Excel:", error);
        return ERROR_RESPONSE(
          res,
          false,
          HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
          "Failed to generate Excel file."
        );
      }
    }

    if (doc) {
      try {
        const wordAttachment = await generateWord(isUser);
        attachments.push(wordAttachment);
      } catch (error) {
        console.error("Error generating Word doc:", error);
        return ERROR_RESPONSE(
          res,
          false,
          HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
          "Failed to generate Word document."
        );
      }
    }

    if (attachments.length > 0) {
      try {
        await sendEmailWithFiles(
          email,
          "User Data",
          "Please find the requested files below.",
          attachments
        );

        return SUCCESS_RESPONSE(
          res,
          true,
          HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
          null,
          "Files generated and sent successfully"
        );
      } catch (error) {
        console.error("Error sending email with file:", error);
        return ERROR_RESPONSE(
          res,
          false,
          HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
          "Email with file sending failed."
        );
      }
    } else {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "No files selected please select a file and try again"
      );
    }
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
 * This function handles the API call for delete user data by specific id
 * @param {IUserRequest} req - req body
 * @param {IUserRequest} req - req user id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const deleteUser = async (
  req: IUserRequest,
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
    const userID = parseInt(id);

    const isUser = await prisma.users.findUnique({
      where: {
        id: userID,
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

    const data = await prisma.users.delete({
      where: { id: userID },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      data,
      VALIDATION_MESSAGES.DELETE_USER
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

export const createUpdateSocialMediaLinks = async (
  req: IUserRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    const userID = req.jwt?.id ? parseInt(req.jwt.id) : undefined;
    const {
      website,
      twitter,
      linkedIn,
      facebook,
      instagram,
      youtube,
      discord,
      telegram,
    } = req.body;

    if (!userID) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_USER
      );
    }

    const existingLinks = await prisma.socialMediaLinks.findFirst({
      where: { usersId: userID },
    });

    let socialMediaLinks;
    if (existingLinks) {
      socialMediaLinks = await prisma.socialMediaLinks.update({
        where: { id: existingLinks.id },
        data: {
          website,
          twitter,
          linkedIn,
          facebook,
          instagram,
          youtube,
          discord,
          telegram,
        },
      });
    } else {
      socialMediaLinks = await prisma.socialMediaLinks.create({
        data: {
          usersId: userID,
          website,
          twitter,
          linkedIn,
          facebook,
          instagram,
          youtube,
          discord,
          telegram,
        },
      });
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      socialMediaLinks,
      MESSAGES.DATA_SUCCESS
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

export const getSocialMediaLinks = async (
  req: IUserRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    const userId = parseInt(req.params.id);

    if (!userId) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_USER
      );
    }

    const socialMediaLinks = await prisma.socialMediaLinks.findFirst({
      where: { usersId: userId },
    });

    // if (!socialMediaLinks) {
    //   return ERROR_RESPONSE(
    //     res,
    //     false,
    //     HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
    //     MESSAGES.RESULT_NOT_FOUND
    //   );
    // }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      socialMediaLinks,
      MESSAGES.DATA_SUCCESS
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

export const getSocialMediaLinksByToken = async (
  req: IUserRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const userID = req.jwt?.id ? parseInt(req.jwt.id) : undefined;

    if (!userID) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_USER
      );
    }

    let socialMediaLinks: SocialMediaLinks | null;

    socialMediaLinks = await prisma.socialMediaLinks.findFirst({
      where: { usersId: userID },
    });

    if (!socialMediaLinks) {
      socialMediaLinks = await prisma.socialMediaLinks.create({
        data: {
          usersId: userID,
        },
      });
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      socialMediaLinks,
      MESSAGES.DATA_SUCCESS
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

export const getAllUserPreferencesMain = async (
  req: IPrefferencesRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }
    const { page, limit, search, sortBy, sortType } = req.query;
    const parsedPage = page ? parseInt(page) : 1;
    const parsedLimit = limit ? parseInt(limit) : 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const correctionsFilter: Prisma.UserSettingsWhereInput = {
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

    const [totalCount, userPreferences] = await Promise.all([
      prisma.userSettings.count({ where: correctionsFilter }),
      prisma.userSettings.findMany({
        skip,
        take: parsedLimit,
        orderBy: sortBy
          ? { [sortBy]: sortType ? sortType : "asc" }
          : { createdAt: "desc" },
        include: {
          user: {
            select: {
              fname: true,
              lname: true,
              email: true,
            },
          },
        },
        where: search ? correctionsFilter : {},
      }),
    ]);

    const totalPages = Math.ceil(totalCount / parsedLimit);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        userPreferences,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      MESSAGES.DATA_SUCCESS
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

export const addNewWallet = async (req: IWalletRequest, res: Response) => {
  try {
    const { walletAddress, provider } = req.body;
    const { id } = req.user as {
      id?: string;
      role?: string;
    };

    const userCount = await prisma.users.count({ where: { id: Number(id) } });

    if (userCount < 1)
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        VALIDATION_MESSAGES.USER_NOT_FOUND
      );

    const walletCount = await prisma.linkWallet.count({
      where: { address: walletAddress },
    });

    if (walletCount > 0)
      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        VALIDATION_MESSAGES.LINKWALLET_ALREADY_EXIST,
        MESSAGES.DATA_SUCCESS
      );

    await prisma.linkWallet.create({
      data: {
        address: walletAddress,
        userId: Number(id),
        provider,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
      "wallet has been saved",
      MESSAGES.CREATED
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

export const getProfileByWalletAddress = async (
  req: IUserRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const walletAddress = req.params.walletId as string;

    if (!walletAddress) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
        "Wallet address is required"
      );
    }

    const user = await prisma.users.findFirst({
      where: {
        isPublish: true,
        linkedWallets: {
          some: {
            address: walletAddress,
          },
        },
      },
      include: {
        applications: true,
        collections: true,
        settings: true,
        linkedWallets: true,
        ownedNFTs: true,
        listings: true,
        SocialMediaLinks: true,
      },
    });

    if (!user) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        TOKEN_VALIDATION_MESSAGES.NO_ACCESS
      );
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      user,
      VALIDATION_MESSAGES.USER_RETRIEVED
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    logger.error(error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

export const getSocialMediaLinksByWalletAddress = async (
  req: IUserRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const walletAddress = req.params.walletAddress as string;
    if (!walletAddress) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_USER
      );
    }

    const user = await prisma.users.findFirst({
      where: {
        linkedWallets: {
          some: {
            address: walletAddress,
          },
        },
      },
    });
    if (!user) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        MESSAGES.RESULT_NOT_FOUND
      );
    }

    const socialMediaLinks = await prisma.socialMediaLinks.findFirst({
      where: {
        usersId: user.id,
      },
    });

    if (!socialMediaLinks) {
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
      socialMediaLinks,
      MESSAGES.DATA_SUCCESS
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

// export const addNewWalletError = async (
//   _req: IWalletRequest,
//   res: Response
// ) => {
//   try {
//     return ERROR_RESPONSE(
//       res,
//       false,
//       HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
//       "simulating an error"
//     );
//   } catch (error) {
//     return ERROR_RESPONSE(
//       res,
//       false,
//       HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
//       error.message
//     );
//   }
// };
