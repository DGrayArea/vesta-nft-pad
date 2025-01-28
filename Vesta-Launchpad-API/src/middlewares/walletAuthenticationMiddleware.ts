import { ethers } from "ethers";
import { Request, Response, NextFunction } from "express";
import {
  HTTP_STATUS_CODE,
  TOKEN_VALIDATION_MESSAGES,
} from "../common/constants";
import { ERROR_RESPONSE } from "../helpers/responseHelpers";
interface CustomRequest extends Request {
  account?: string;
}

export const signatureMiddleWare = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.headers.authorization) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        TOKEN_VALIDATION_MESSAGES.MISSING_SIGNATURE
      );
    }
    const token = req.headers.authorization.split("Bearer")[1].trim();
    const isVerify = await isVerified(req.body, token, req.body.sender);

    if (!isVerify) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        TOKEN_VALIDATION_MESSAGES.INVALID_SIGNATURE
      );
    }

    req.account = isVerify;

    return next();
  } catch (error) {
    // Handle internal server error
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

const isVerified = async (
  payload: any,
  signature: string,
  senderAddress: string
) => {
  const recoveredAddress = ethers.verifyMessage(payload, signature);

  const isValid =
    recoveredAddress.toLowerCase() === senderAddress.toLowerCase();

  if (isValid) {
    return recoveredAddress;
  } else {
    return false;
  }
};
