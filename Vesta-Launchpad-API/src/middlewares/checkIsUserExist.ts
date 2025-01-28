import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS_CODE, VALIDATION_MESSAGES } from "../common/constants";
import prisma from "../common/prisma-client";
import { ERROR_RESPONSE } from "../helpers/responseHelpers";

interface IUserRequest extends Request {
  //make every key string type to any
  [key: string]: any;
}

/**
 * Middleware to check if the user exists and attach user data to the request.
 * @param {IUserRequest} req - Express request with user ID (from JWT)
 * @param {express} res - Express response
 * @param {NextFunction} next - Express next middleware function
 * @return {void} - Calls the next middleware if the user exists, else returns an error response.
 */
export async function checkIsUserExist(
  req: IUserRequest,
  res: Response,
  next: NextFunction
) {
  // Get the user ID from the JWT token in the request
  const userID = req.jwt?.id;

  try {
    // Query the database to find the user based on the user ID
    const user = await prisma.users.findFirst({
      where: { id: userID, status: "APPROVED" },
    });

    // If the user does not exist, return an error response
    if (!user) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_USER
      );
    }

    req.user = user;

    return next();
  } catch (error) {
    console.error(error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
}
