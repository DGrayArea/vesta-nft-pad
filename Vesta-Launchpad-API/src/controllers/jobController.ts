import { Response, NextFunction } from "express";
import prisma from "../common/prisma-client";
import {
  HTTP_STATUS_CODE,
  REQUEST_METHOD,
  MESSAGES,
  VALIDATION_MESSAGES,
} from "../common/constants";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "../helpers/responseHelpers";
import { IJobRequest } from "../helpers/Interface";
import { logger } from "../helpers/loggers";

/**
 * This function handles the API call for showing all jobs data with pagination
 *
 * @param {IJobRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllJobs = async (
  req: IJobRequest,
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

    const [totalCount, jobs] = await Promise.all([
      prisma.job.count({}),
      prisma.job.findMany({
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!jobs || jobs.length <= 0) {
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
        data: jobs,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.POST_RETRIEVED
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
 * This function handles the API call for find job data by specific id
 *
 * @param {IJobRequest} req - req job id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const getJobByID = async (
  req: IJobRequest,
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
    const jobID = parseInt(id);

    const job = await prisma.job.findUnique({
      where: {
        id: jobID,
      },
    });

    if (!job) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_JOB
      );
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      job,
      VALIDATION_MESSAGES.JOB_RETRIEVED
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
 * Handles the API call for create job.
 *
 * @param {IJobRequest} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<Response>} A response object containing a status, data, and message.
 */
export const createJob = async (
  req: IJobRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }
    const userID: any = req.user?.id ? req.user.id : undefined;

    const {
      category,
      description,
      featuredImage,
      jobDes,
      location,
      requirements,
      salary,
      skills,
      title,
    } = req.body;

    const isJob = await prisma.job.findFirst({
      where: {
        title,
      },
    });

    if (isJob) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.JOB_ALREADY_EXIST
      );
    }

    const job = await prisma.job.create({
      data: {
        category,
        description,
        featuredImage,
        jobDes,
        location,
        requirements,
        salary,
        skills,
        title,
        creatorId: userID,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
      job,
      VALIDATION_MESSAGES.CREATE_JOB
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
 * This function handles the API call for get all job by category (filter by category)
 *
 * @param {IJobRequest} req - req job id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const getJobByCategory = async (
  req: IJobRequest,
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

    const { category } = req.body;

    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const jobs = await prisma.job.findMany({
      where: {
        category: category,
      },
      skip,
      take: parsedLimit,
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!jobs || jobs.length <= 0) {
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
        data: jobs,
        pagination: {
          currentPage: parsedPage,
          totalResults: jobs.length,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.JOB_RETRIEVED
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
 * This function handles the API call for update job data by specific id
 *
 * @param {IJobRequest} req - req job id
 * @param {IJobRequest} req - req body
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const updateJob = async (
  req: IJobRequest,
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
    const jobID = parseInt(id);

    const {
      category,
      description,
      featuredImage,
      jobDes,
      location,
      requirements,
      salary,
      skills,
      title,
    } = req.body;

    const isJob = await prisma.job.findUnique({
      where: { id: jobID },
    });

    if (!isJob) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_JOB
      );
    }

    const job = await prisma.job.update({
      where: { id: jobID },
      data: {
        category,
        description,
        featuredImage,
        jobDes,
        location,
        requirements,
        salary,
        skills,
        title,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      job,
      VALIDATION_MESSAGES.UPDATE_JOB
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
 * This function handles the API call for delete job data by specific id
 *
 * @param {IJobRequest} req - req body
 * @param {IJobRequest} req - req job id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const deleteJob = async (
  req: IJobRequest,
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
    const jobID = parseInt(id);

    const isJob = await prisma.job.findUnique({
      where: {
        id: jobID,
      },
    });

    if (!isJob) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_JOB
      );
    }

    const job = await prisma.job.delete({
      where: { id: jobID },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      job,
      VALIDATION_MESSAGES.DELETE_JOB
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
