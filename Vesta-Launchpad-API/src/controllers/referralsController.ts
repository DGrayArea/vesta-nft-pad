import { Response } from "express";
import CryptoJS from "crypto-js";

import prisma from "@/common/prisma-client";
import { IRefferalsRequest, IRefferalsRequestAlt } from "@/helpers/Interface";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "@/helpers/responseHelpers";
import { HTTP_STATUS_CODE, VALIDATION_MESSAGES } from "@/common/constants";

interface IRefferalParamsInterface {
  userId: number;
  referralId: string;
  walletAddress: string;
}

// interface IReffeeralBodyInterface {
//   userId: number;
// }

/**
 * use to check if user has a reff code already
 * @param userId
 * @returns
 */
const IfUserHasReffCode = async (userId: number) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    return Boolean(user?.referralCode);
  } catch (error) {
    throw error;
  }
};

/**
 * use to check the if the generated reff code already exist
 * @param reffCode
 * @returns
 */
const isReffCodeExist = async (reffCode: string) => {
  try {
    const count = await prisma.users.count({
      where: { referralCode: reffCode },
    });

    return count > 0;
  } catch (error) {
    throw error;
  }
};

export const generateReferralCode = async (
  req: IRefferalsRequest<Pick<IRefferalParamsInterface, "userId">, undefined>,
  res: Response
) => {
  try {
    const { userId } = req.params;

    const isUserReffExist = await IfUserHasReffCode(Number(userId));

    if (!isUserReffExist) {
      let referralCode = generateUniqueReferralCode(userId);

      while (await isReffCodeExist(referralCode)) {
        referralCode = generateUniqueReferralCode(userId);
      }

      await prisma.users.update({
        where: { id: Number(userId) },
        data: { referralCode: referralCode },
      });

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
        referralCode,
        VALIDATION_MESSAGES.CREATE_REFF
      );
    }

    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
      VALIDATION_MESSAGES.REFF_ALREADY_EXIST_FOR_USER
    );
  } catch (error) {
    console.error("Error generating referral code:", error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      "Error generating or updating referral code. Please try again."
    );
  }
};

const generateUniqueReferralCode = (userId: number): string => {
  const baseCode = `${userId}-${Date.now()}`;
  // return CryptoJS.SHA256(baseCode).toString(CryptoJS.enc.Hex);
  const hash = CryptoJS.SHA256(baseCode).toString(CryptoJS.enc.Base64);

  return hash.replace(/=/g, "").substring(0, 10);
};

// ! why do we need an update??
export const updateReferralCode = async (
  req: IRefferalsRequest<Pick<IRefferalParamsInterface, "userId">, undefined>,
  res: Response
) => {
  try {
    const { userId } = req.params;

    let newReferralCode = generateUniqueReferralCode(userId);

    while (await isReffCodeExist(newReferralCode)) {
      newReferralCode = generateUniqueReferralCode(userId);
    }

    const user = await prisma.users.update({
      where: { id: Number(userId) },
      data: { referralCode: newReferralCode },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
      user,
      VALIDATION_MESSAGES.UPDATE_REFF
    );
  } catch (error) {
    console.error("Error updating referral code:", error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      "Error generating or updating referral code. Please try again."
    );
  }
};

export const deleteReferralCode = async (
  req: IRefferalsRequest<Pick<IRefferalParamsInterface, "userId">, undefined>,
  res: Response
) => {
  try {
    const { userId } = req.params;

    await prisma.users.update({
      where: { id: Number(userId) },
      data: { referralCode: null },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      true,
      VALIDATION_MESSAGES.DELETE_REFF
    );
  } catch (error) {
    console.error("Error deleting referral code:", error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      "Error generating or updating referral code. Please try again."
    );
  }
};

export const getReferralCode = async (
  req: IRefferalsRequest<Pick<IRefferalParamsInterface, "userId">, undefined>,
  res: Response
) => {
  try {
    const { userId } = req.params;

    const user = await prisma.users.findUnique({
      where: { id: Number(userId) },
      select: { referralCode: true },
    });

    if (!user) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        VALIDATION_MESSAGES.USER_NOT_FOUND
      );
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      user.referralCode,
      VALIDATION_MESSAGES.REFF_CODE_RETRIEVED
    );
  } catch (error) {
    console.error("Error fetching referral code:", error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

//get Referral Code by token
export const getReferralCodeByUser = async (
  req: IRefferalsRequest<Pick<IRefferalParamsInterface, "userId">, undefined>,
  res: Response
) => {
  try {
    const userId = req.jwt?.id ? parseInt(req.jwt.id) : undefined;

    const user = await prisma.users.findUnique({
      where: { id: Number(userId) },
      select: { referralCode: true },
    });

    if (!user) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        VALIDATION_MESSAGES.USER_NOT_FOUND
      );
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      user.referralCode,
      VALIDATION_MESSAGES.REFF_CODE_RETRIEVED
    );
  } catch (error) {
    console.error("Error fetching referral code:", error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

export const joinByReffCode = async (
  req: IRefferalsRequest<any, undefined>,
  res: Response
) => {
  try {
    const { reffCode, email } = req.query;

    const reffOwner = await prisma.users.findFirst({
      where: { referralCode: reffCode },
    });

    if (!reffOwner)
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        VALIDATION_MESSAGES.USER_NOT_FOUND
      );

    const reffUser = await prisma.users.findFirst({
      where: { email: email?.toString() },
    });

    const reff = await prisma.referrer.create({
      data: {
        referrer: reffOwner.id,
        referred: reffUser?.id,
      },
      include: {
        referredToUser: true,
        referrerToUser: true,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      reff,
      VALIDATION_MESSAGES.REFFERAL_RETRIEVED
    );
  } catch (error) {
    console.error("Error fetching referral code:", error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

export const getMyRefferals = async (
  req: IRefferalsRequest<IRefferalParamsInterface, undefined>,
  res: Response
) => {
  try {
    // const { userId } = req.params;
    const userId = req.jwt?.id ? parseInt(req.jwt.id) : undefined;

    const { page, limit } = req.query;
    const parsedPage = parseInt(page as string) || 1;
    const parsedLimit = parseInt(limit as string) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const user = await prisma.users.findFirst({
      where: { id: Number(userId) },
    });

    if (!user) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        "User not found"
      );
    }

    const myReferals = await prisma.referrer.findMany({
      where: {
        referrer: user?.id,
      },
      include: {
        referredToUser: {
          include: { referrerToUser: true },
        },
      },
      skip,
      take: parsedLimit,
      orderBy: {
        referredToUser: {
          createdAt: "desc",
        },
      },
    });

    const totalCount = await prisma.referrer.count({
      where: {
        referrer: user?.id,
      },
    });

    const totalPages = Math.ceil(totalCount / parsedLimit);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: myReferals,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.REFFERAL_RETRIEVED
    );
  } catch (error) {
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      "An error occurred"
    );
  }
};

export const getMyRefferalsLevelTwo = async (
  req: IRefferalsRequest<IRefferalParamsInterface, undefined>,
  res: Response
) => {
  try {
    const userId = req.jwt?.id ? parseInt(req.jwt.id) : undefined;

    const { page, limit } = req.query;
    const parsedPage = parseInt(page as string) || 1;
    const parsedLimit = parseInt(limit as string) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const user = await prisma.users.findFirst({
      where: { id: Number(userId) },
    });

    if (!user) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        "User not found"
      );
    }

    const myReferals = await prisma.referrer.findMany({
      where: {
        referrer: user?.id,
      },
      include: {
        referredToUser: {
          include: { referrerToUser: true },
        },
      },
      orderBy: {
        referredToUser: {
          createdAt: "desc",
        },
      },
    });

    const level2UIds: number[] = [];

    myReferals.forEach((ref) => {
      ref.referredToUser?.referrerToUser.forEach((r) => {
        if (r.referred !== null) level2UIds.push(r.referred);
      });
    });

    const level2RefUsers = await prisma.users.findMany({
      where: {
        id: {
          in: level2UIds,
        },
      },

      skip,
      take: parsedLimit,
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalCount = await prisma.users.count({
      where: {
        id: {
          in: level2UIds,
        },
      },
    });

    const totalPages = Math.ceil(totalCount / parsedLimit);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: level2RefUsers,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.REFFERAL_RETRIEVED
    );
  } catch (error) {
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      "An error occurred"
    );
  }
};

// export const getMyRefferalsCount = async (
//   req: IRefferalsRequest<IRefferalParamsInterface, undefined>,
//   res: Response
// ) => {
//   try {
//     const userId = req.jwt?.id ? parseInt(req.jwt.id) : undefined;

//     const user = await prisma.users.findFirst({
//       where: { id: Number(userId) },
//     });

//     if (!user) {
//       // return user not found error
//       // return ERROR_RESPONSE(res, false, HTTP_STATUS_CODE.NOT_FOUND, "User not found");
//     }

//     const totalLevel1Count = await prisma.referrer.count({
//       where: {
//         referrer: user?.id,
//       },
//     });

//     return SUCCESS_RESPONSE(
//       res,
//       true,
//       HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
//       {
//         totalLevel1Results: totalLevel1Count,
//       },
//       VALIDATION_MESSAGES.REFFERAL_RETRIEVED
//     );
//   } catch (error) {
//     // return error response
//     return ERROR_RESPONSE(
//       res,
//       false,
//       HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
//       "An error occurred"
//     );
//   }
// };

export const getMyRefferalsCount = async (
  req: IRefferalsRequest<IRefferalParamsInterface, undefined>,
  res: Response
) => {
  try {
    const userId = req.jwt?.id ? parseInt(req.jwt.id) : undefined;

    const user = await prisma.users.findFirst({
      where: { id: Number(userId) },
    });

    if (!user) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        "User not found"
      );
    }

    const totalLevel1Count = await prisma.referrer.count({
      where: {
        referrer: user.id,
      },
    });

    const level1Referrals = await prisma.referrer.findMany({
      where: {
        referrer: user.id,
      },
      select: {
        referred: true,
      },
    });

    const referredIds = level1Referrals
      .map((r) => r.referred)
      .filter((id): id is number => id !== null);

    const totalLevel2Count = await prisma.referrer.count({
      where: {
        referrer: {
          in: referredIds,
        },
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        totalLevel1Results: totalLevel1Count,
        totalLevel2Results: totalLevel2Count,
      },
      VALIDATION_MESSAGES.REFFERAL_RETRIEVED
    );
  } catch (error) {
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      "An error occurred"
    );
  }
};

export const generateReferralCodeByToken = async (
  req: IRefferalsRequestAlt,
  res: Response
) => {
  try {
    const userIdS = req.jwt?.id;

    if (!userIdS) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "User ID is required."
      );
    }
    const userId = Number(userIdS);

    const isUserReffExist = await IfUserHasReffCode(userId);

    if (!isUserReffExist) {
      let referralCode = generateUniqueReferralCode(userId);

      while (await isReffCodeExist(referralCode)) {
        referralCode = generateUniqueReferralCode(userId);
      }

      await prisma.users.update({
        where: { id: userId },
        data: { referralCode: referralCode },
      });

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
        referralCode,
        VALIDATION_MESSAGES.CREATE_REFF
      );
    }

    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
      VALIDATION_MESSAGES.REFF_ALREADY_EXIST_FOR_USER
    );
  } catch (error) {
    console.error("Error generating referral code:", error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      "Error generating or updating referral code. Please try again."
    );
  }
};

export const getReferralCodeByWalletId = async (
  req: IRefferalsRequest<
    Pick<IRefferalParamsInterface, "walletAddress">,
    undefined
  >,
  res: Response
) => {
  try {
    const walletAddress = req.params.walletId as string;
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
      select: { referralCode: true },
    });
    if (!user) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        VALIDATION_MESSAGES.USER_NOT_FOUND
      );
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      user.referralCode,
      VALIDATION_MESSAGES.REFF_CODE_RETRIEVED
    );
  } catch (error) {
    console.error("Error fetching referral code:", error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

export const getUserRefferalsLevelOneByWallet = async (
  req: IRefferalsRequest<IRefferalParamsInterface, undefined>,
  res: Response
) => {
  try {
    const walletAddress = req.params.walletId as string;
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
        "User not found"
      );
    }

    const { page, limit } = req.query;
    const parsedPage = parseInt(page as string) || 1;
    const parsedLimit = parseInt(limit as string) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const myReferals = await prisma.referrer.findMany({
      where: {
        referrer: user?.id,
      },
      include: {
        referredToUser: {
          include: { referrerToUser: true },
        },
      },
      skip,
      take: parsedLimit,
      orderBy: {
        referredToUser: {
          createdAt: "desc",
        },
      },
    });

    const totalCount = await prisma.referrer.count({
      where: {
        referrer: user?.id,
      },
    });

    const totalPages = Math.ceil(totalCount / parsedLimit);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: myReferals,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.REFFERAL_RETRIEVED
    );
  } catch (error) {
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      "An error occurred"
    );
  }
};
