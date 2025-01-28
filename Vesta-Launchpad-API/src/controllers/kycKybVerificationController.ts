import { NextFunction, Response } from "express";
import prisma from "../common/prisma-client";
import { SUCCESS_RESPONSE, ERROR_RESPONSE } from "../helpers/responseHelpers";
import { logger } from "../helpers/loggers";
import fetch from "node-fetch";
import crypto from "crypto";
import {
  HTTP_STATUS_CODE,
  REQUEST_METHOD,
  STATUS,
  VALIDATION_MESSAGES,
} from "../common/constants";
import { KycRequest } from "@/helpers/Interface";

const sumsubBaseUrl = process.env.SUM_SUB_BASE_URL as string;
const sumsubToken = process.env.SUMSUB_API_KEY as string;
const sumsubSecret = process.env.SUMSUB_API_SECRET as string;
const sumsubKycLevel = process.env.KYC_LEVEL as string;
const sumsubKybLevel = process.env.KYB_LEVEL as string;

const createSignature = (
  url: string,
  method: string,
  data: string | null = null
) => {
  const ts = Math.floor(Date.now() / 1000);
  const signature = crypto.createHmac("sha256", sumsubSecret);
  signature.update(`${ts}${method.toUpperCase()}${url}`);

  if (data) {
    signature.update(data);
  }

  const headers = {
    "X-App-Access-Ts": ts.toString(),
    "X-App-Access-Sig": signature.digest("hex"),
    "X-App-Token": sumsubToken,
    "Content-Type": "application/json",
  };

  return headers;
};

export const generateKycExternalLink = async (
  req: KycRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const { userId } = req.params;

    // const userId = "55";

    const user = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        VALIDATION_MESSAGES.USER_NOT_FOUND
      );
    }

    const url = `/resources/sdkIntegrations/levels/${encodeURIComponent(
      sumsubKycLevel
    )}/websdkLink?externalUserId=${userId}`;
    const method = "POST";

    if (!user.kyc_applicant_id) {
      const applicantId = await createApplicant(parseInt(userId), "kyc");

      await prisma.users.update({
        where: { id: parseInt(userId) },
        data: { kyc_applicant_id: applicantId },
      });
    }

    const headers = createSignature(url, method);

    const response = await fetch(sumsubBaseUrl + url, {
      method,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
        error.message
      );
    }

    const data = await response.json();
    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      data,
      VALIDATION_MESSAGES.KYC_LINK_GENERATED
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

export const generateKybExternalLink = async (
  req: KycRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const { applicationUUID } = req.params;

    // const userId = "55";

    const application = await prisma.application.findUnique({
      where: { applicationUUID: applicationUUID },
    });

    if (!application) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        VALIDATION_MESSAGES.USER_NOT_FOUND
      );
    }

    const url = `/resources/sdkIntegrations/levels/${encodeURIComponent(
      sumsubKybLevel
    )}/websdkLink?externalUserId=${applicationUUID}`;
    const method = "POST";

    if (!application.kyb_applicant_id) {
      const applicantId = await createApplicant(
        parseInt(applicationUUID),
        "kyb"
      );

      await prisma.application.update({
        where: { applicationUUID: applicationUUID },
        data: { kyb_applicant_id: applicantId },
      });
    }

    const headers = createSignature(url, method);

    const response = await fetch(sumsubBaseUrl + url, {
      method,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
        error.message
      );
    }

    const data = await response.json();
    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      data,
      VALIDATION_MESSAGES.KYB_LINK_GENERATED
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

export const checkKycStatus = async (
  req: KycRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const { userId } = req.params;

    const user = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
      select: { kyc_applicant_id: true },
    });

    if (!user || !user.kyc_applicant_id) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        VALIDATION_MESSAGES.USER_NOT_FOUND
      );
    }

    const url = `/resources/applicants/${user.kyc_applicant_id}/status`;

    const method = "GET";

    const headers = createSignature(url, method);

    const response = await fetch(sumsubBaseUrl + url, {
      method,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
        error.message
      );
    }

    const data = await response.json();
    if (data?.reviewStatus) {
      let kycStatus = STATUS.PENDING;

      if (data.reviewStatus === "completed") {
        const reviewAnswer = data?.reviewResult?.reviewAnswer;

        if (reviewAnswer === "GREEN") {
          kycStatus = STATUS.APPROVE;
        } else if (reviewAnswer === "RED") {
          kycStatus = STATUS.REJECT;
        }
      }

      await prisma.users.update({
        where: { id: parseInt(userId) },
        data: { kyc_verificaion_status: kycStatus },
      });

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        { status: kycStatus },
        VALIDATION_MESSAGES.KYC_STATUS_RETRIEVED
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

export const checkKybStatus = async (
  req: KycRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const { applicationUUID } = req.params;

    const application = await prisma.application.findUnique({
      where: { applicationUUID: applicationUUID },
      select: { kyb_applicant_id: true, status: true },
    });

    if (!application || !application.kyb_applicant_id) {
      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        { status: application?.status },
        VALIDATION_MESSAGES.APPLICATION_NOT_FOUND
      );
    }
    const url = `/resources/applicants/${application.kyb_applicant_id}/status`;

    const method = "GET";

    const headers = createSignature(url, method);

    const response = await fetch(sumsubBaseUrl + url, {
      method,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
        error.message
      );
    }

    const data = await response.json();
    if (data?.reviewStatus) {
      let kycStatus = STATUS.KYB_PENDING;

      if (data.reviewStatus === "completed") {
        const reviewAnswer = data?.reviewResult?.reviewAnswer;

        if (reviewAnswer === "GREEN") {
          kycStatus = STATUS.PENDING;
        } else if (reviewAnswer === "RED") {
          kycStatus = STATUS.REJECT;
        }
      }

      await prisma.application.update({
        where: { applicationUUID: applicationUUID },
        data: { status: kycStatus },
      });

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        { status: kycStatus },
        VALIDATION_MESSAGES.KYB_STATUS_RETRIEVED
      );
    }
    // return SUCCESS_RESPONSE(
    //   res,
    //   true,
    //   HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
    //   data,
    //   VALIDATION_MESSAGES.KYB_STATUS_RETRIEVED
    // );
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

const createApplicant = async (
  userId: number,
  type: string
): Promise<string> => {
  const level = type === "kyc" ? sumsubKycLevel : sumsubKybLevel;
  const reqtype = type === "kyc" ? "individual" : "company";

  const url = `/resources/applicants?levelName=${level}`;
  const method = "POST";
  const body = JSON.stringify({
    externalUserId: userId,
    type: reqtype,
  });
  const headers = createSignature(url, method, body);

  const response = await fetch(sumsubBaseUrl + url, {
    method,
    headers,
    body,
  });

  if (!response.ok) {
    const data = await response.json();
    if (response.status === 201) {
      return data.id;
    } else if (response.status === 409) {
      const existingApplicantIdMatch = data.description.match(
        /already exists: (\w+)/
      );
      if (existingApplicantIdMatch) {
        const existingApplicantId = existingApplicantIdMatch[1];

        return existingApplicantId;
      } else {
        throw new Error(
          "Applicant ID could not be extracted from the 409 error response."
        );
      }
    } else {
      console.error("Error response from Sumsub:", data);
      throw new Error(
        data.description ||
          "Unknown error occurred while creating the applicant."
      );
    }
  }

  const data = await response.json();
  return data.id;
};
