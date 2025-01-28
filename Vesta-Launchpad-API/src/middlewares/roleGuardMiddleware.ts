import { NextFunction, Response } from "express";

import { IAuthenticatedRequest } from "./authenticationMiddleware";
import { ERROR_RESPONSE } from "../helpers/responseHelpers";
import {
  HTTP_STATUS_CODE,
  TOKEN_VALIDATION_MESSAGES,
} from "../common/constants";

export enum Roles {
  ADMIN = "ADMIN",
  USER = "USER",
}

export const rolesGuard = (roles: Roles[]) => {
  return (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user || !roles.includes(user?.role as Roles))
        return ERROR_RESPONSE(
          res,
          false,
          HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
          TOKEN_VALIDATION_MESSAGES.NO_ACCESS_OR_MISSING_TOKEN
        );

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
  };
};
