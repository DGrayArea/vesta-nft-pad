import { Response, NextFunction } from "express";
import prisma from "../common/prisma-client";
import {
  HTTP_STATUS_CODE,
  REQUEST_METHOD,
  MESSAGES,
  VALIDATION_MESSAGES,
} from "../common/constants";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "../helpers/responseHelpers";
import { IPostRequest } from "../helpers/Interface";
import { logger } from "../helpers/loggers";

/**
 * This function handles the API call for showing all post data with pagination
 *
 * @param {IPostRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllPosts = async (
  req: IPostRequest,
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

    const [totalCount, posts] = await Promise.all([
      prisma.post.count({}),
      prisma.post.findMany({
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              fname: true,
              lname: true,
              address: true,
              email: true,
              profileImage: true,
            },
          },
        },
      }),
    ]);

    if (!posts || posts.length <= 0) {
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
        data: posts,
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
 * This function handles the API call for showing all post data with pagination
 *
 * @param {IPostRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllApprovePosts = async (
  req: IPostRequest,
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

    const [totalCount, posts] = await Promise.all([
      prisma.post.count({ where: { isPublish: true } }),
      prisma.post.findMany({
        where: { isPublish: true },
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              fname: true,
              lname: true,
              address: true,
              email: true,
              profileImage: true,
            },
          },
        },
      }),
    ]);

    if (!posts || posts.length <= 0) {
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
        data: posts,
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
 * This function handles the API call for find post data by specific id
 *
 * @param {IPostRequest} req - req post id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const getPostByID = async (
  req: IPostRequest,
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
    const postID = parseInt(id);

    const post = await prisma.post.findUnique({
      where: {
        id: postID,
      },
      include: {
        author: {
          select: {
            fname: true,
            lname: true,
            address: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    if (!post) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_POST
      );
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      post,
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
 * This function handles the API call for get all post by tags (filter by tags)
 *
 * @param {IPostRequest} req - req post id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const getPostByTags = async (
  req: IPostRequest,
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

    const { tags } = req.body;

    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const posts = await prisma.post.findMany({
      where: {
        tags: {
          hasSome: tags,
        },
      },
      skip,
      take: parsedLimit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            fname: true,
            lname: true,
            address: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    if (!posts || posts.length <= 0) {
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
        data: posts,
        pagination: {
          currentPage: parsedPage,
          totalResults: posts.length,
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
 * This function handles the API call for get all post by post type (filter by type) blog or news
 *
 * @param {IPostRequest} req - req post id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getPostsByPostType = async (
  req: IPostRequest,
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
    const { postType } = req.body; // BLOG OR NEWS
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const posts = await prisma.post.findMany({
      where: {
        postType: postType,
      },
      skip,
      take: parsedLimit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            fname: true,
            lname: true,
            address: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    if (!posts || posts.length <= 0) {
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
        data: posts,
        pagination: {
          currentPage: parsedPage,
          totalResults: posts.length,
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
 * Handles the API call for create post.
 *
 * @param {IPostRequest} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<Response>} A response object containing a status, data, and message.
 */
export const createPost = async (
  req: IPostRequest,
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
      seoTitle,
      seoDescription,
      featuredimage,
      title,
      body,
      category,
      isPublish,
      postType,
      tags,
    } = req.body;

    const isPost = await prisma.post.findFirst({
      where: {
        title,
      },
    });

    if (isPost) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.POST_ALREADY_EXIST
      );
    }

    const post = await prisma.post.create({
      data: {
        featuredimage,
        seoTitle,
        seoDescription,
        body,
        title,
        category,
        isPublish,
        postType,
        tags,
        authorId: userID,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
      post,
      VALIDATION_MESSAGES.CREATE_POST
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
 * This function handles the API call for update post data by specific id
 *
 * @param {IPostRequest} req - req post id
 * @param {IPostRequest} req - req body
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const updatePost = async (
  req: IPostRequest,
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
    const postID = parseInt(id);

    const {
      seoTitle,
      seoDescription,
      featuredimage,
      body,
      title,
      category,
      isPublish,
      postType,
      tags,
    } = req.body;

    const isPost = await prisma.post.findUnique({
      where: { id: postID },
    });
    if (!isPost) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_POST
      );
    }

    const post = await prisma.post.update({
      where: { id: postID },
      data: {
        seoTitle,
        seoDescription,
        featuredimage,
        body,
        title,
        category,
        isPublish,
        postType,
        tags,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      post,
      VALIDATION_MESSAGES.UPDATE_POST
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
 * This function handles the API call for approve or reject the post  by specific id
 *
 * @param {IPostRequest} req - req post id
 * @param {IPostRequest} req - req body
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const approveOrRejectPost = async (
  req: IPostRequest,
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
    const postID = parseInt(id);

    const { isPublish } = req.body;

    const isPost = await prisma.post.findUnique({
      where: { id: postID },
    });
    if (!isPost) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_POST
      );
    }

    const post = await prisma.post.update({
      where: { id: postID },
      data: {
        isPublish,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      post,
      VALIDATION_MESSAGES.UPDATE_POST
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
 * This function handles the API call for delete post data by specific id
 *
 * @param {IPostRequest} req - req body
 * @param {IPostRequest} req - req post id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const deletePost = async (
  req: IPostRequest,
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
    const postID = parseInt(id);

    const isPost = await prisma.post.findUnique({
      where: {
        id: postID,
      },
    });

    if (!isPost) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_POST
      );
    }

    const post = await prisma.post.delete({
      where: { id: postID },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      post,
      VALIDATION_MESSAGES.DELETE_POST
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
