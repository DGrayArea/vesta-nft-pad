import { Request, Response, NextFunction } from "express";
import {
  HTTP_STATUS_CODE,
  REQUEST_METHOD,
  VALIDATION_MESSAGES,
} from "../common/constants";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "../helpers/responseHelpers";
import {
  createPresignedUrlWithClient,
  determineFolderName,
  getFileContentType,
} from "../helpers/utils";
import config from "../config/serverConfig";
import { logger } from "../helpers/loggers";
import { ISingleFileUploadRequest } from "@/helpers/Interface";
import { supabase } from "@/routes/commonRoute";

/**
 * Handles the API call for uploading a file.
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} _ - Express next function
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const fileUpload = async (
  req: Request,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.PUT) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.PUT} Allowed`
      );
    }

    const { fileName } = req.params;

    const folder = determineFolderName(fileName);

    const contentType = getFileContentType(fileName);

    const clientUrl = await createPresignedUrlWithClient({
      region: config.s3BucketRegion,
      bucket: config.s3Bucket,
      folder: folder,
      fileName: fileName,
      contentType: contentType,
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
      clientUrl,
      VALIDATION_MESSAGES.FILE_UPLOAD_URL
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
 * Handles the API call for uploading a file.
 *
 * @param {ISingleFileUploadRequest} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} _ - Express next function
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const singleFileUpload = async (
  req: ISingleFileUploadRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }

    const file = req.file;
    if (!file) {
      throw new Error("No file uploaded");
    }

    const folder = determineFolderName(file.originalname);

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(folder)
      .upload(`${Date.now()}-${file.originalname}`, file.buffer, {
        contentType: file.mimetype,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Generate a public URL
    const publicUrl = supabase.storage.from(folder).getPublicUrl(data.path)
      .data.publicUrl;

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
      publicUrl,
      VALIDATION_MESSAGES.FILE_UPLOAD_URL
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
