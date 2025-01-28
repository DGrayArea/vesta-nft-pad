import { Request, Response, NextFunction } from "express";
import jwtToken from "jsonwebtoken";
import config from "../config/serverConfig";
import {
  HTTP_STATUS_CODE,
  TOKEN_VALIDATION_MESSAGES,
} from "../common/constants";
import { ERROR_RESPONSE } from "../helpers/responseHelpers";

export interface IAuthenticatedRequest extends Request {
  //make every key string type to any
  [key: string]: any;
}

interface IDecodedToken {
  id: number;
  name: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Custom Middleware for Route Authentication and Authorization
 * Checks if the user is authenticated and has the required role to access the route.
 * If authentication or authorization fails, appropriate error responses are returned.
 *
 * @param {string[]} requiredRoles - An array of roles that are authorized to access the route.
 * @param {IAuthenticatedRequest} req - The Express request object extended with authentication details.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function in the chain.
 */
export const checkIfAuthenticated = (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if authorization header exists
    if (!req.headers.authorization) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        TOKEN_VALIDATION_MESSAGES.NO_ACCESS_OR_MISSING_TOKEN
      );
    }

    // Extract and validate the token
    const token: string = req.headers.authorization.split("Bearer")[1].trim();
    if (token == null) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        TOKEN_VALIDATION_MESSAGES.TOKEN_MISSING
      );
    }

    // Decode the token + verify the signature validity
    const decoded = jwtToken.verify(
      token,
      config.secret
    ) as IDecodedToken | null;

    if (decoded == null) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        TOKEN_VALIDATION_MESSAGES.INVALID_TOKEN_OR_EXPIRED
      );
    }

    // Assign decoded token to the request object
    req.jwt = decoded;
    // Proceed to the next middleware
    return next();
  } catch (error) {
    // Handle internal server error
    // return ERROR_RESPONSE(
    //   res,
    //   false,
    //   HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
    //   error.message
    // );
    if (error instanceof jwtToken.JsonWebTokenError) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        TOKEN_VALIDATION_MESSAGES.INVALID_TOKEN_OR_EXPIRED
      );
    } else {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
        error.message
      );
    }
  }
};
