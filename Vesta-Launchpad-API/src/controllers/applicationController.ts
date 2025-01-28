import { Response, NextFunction } from "express";
import prisma from "../common/prisma-client";
import {
  HTTP_STATUS_CODE,
  REQUEST_METHOD,
  MESSAGES,
  VALIDATION_MESSAGES,
  STATUS,
} from "../common/constants";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "../helpers/responseHelpers";
import {
  IAapplicationBackersRequest,
  IAapplicationImagesRequest,
  IApplicationRequest,
  IAapplicationSocialLinksRequest,
  IAapplicationTeamMembersRequest,
} from "../helpers/Interface";
import { logger } from "../helpers/loggers";
import { Roles } from "@/middlewares/roleGuardMiddleware";
import { endOfDay, startOfDay } from "date-fns";

/**
 * This function handles the API call for showing all applications data with pagination
 *
 * @param {IApplicationRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllApplications = async (
  req: IApplicationRequest,
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
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const [totalCount, applications] = await Promise.all([
      prisma.application.count({
        where: search
          ? {
              fullName: {
                contains: search,
                mode: "insensitive",
              },
            }
          : undefined,
      }),
      prisma.application.findMany({
        skip,
        take: parsedLimit,
        orderBy: sortBy
          ? { [sortBy]: sortType ? sortType : "asc" }
          : { createdAt: "desc" },
        where: search
          ? {
              fullName: {
                contains: search,
                mode: "insensitive",
              },
            }
          : undefined,
        include: {
          teamMembers: true,
          backers: true,
          images: true,
        },
      }),
    ]);

    // if (!applications || applications.length <= 0) {
    //   return ERROR_RESPONSE(
    //     res,
    //     false,
    //     HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
    //     MESSAGES.RESULT_NOT_FOUND
    //   );
    // }

    const totalPages = Math.ceil(totalCount / parsedLimit);

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        data: applications,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.APPLICATION_RETRIEVED
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
 * This function handles the API call for showing all top application list
 *
 * @param {ICollectionRequest} req - express request
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllApplicationList = async (
  req: IApplicationRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const applications = await prisma.application.findMany({
      where: { status: STATUS.APPROVE },
      orderBy: { createdAt: "desc" },
    });

    if (!applications || applications.length <= 0) {
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
        data: applications,
      },
      VALIDATION_MESSAGES.COLLECTION_RETRIEVED
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

export const getAllLatestCreatedApplication = async (
  req: IApplicationRequest,
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

    const [totalCount, applications] = await Promise.all([
      prisma.application.count({ where: { status: STATUS.APPROVE } }),
      prisma.application.findMany({
        where: { status: STATUS.APPROVE },
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
        select: {
          fullName: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    if (!applications || applications.length <= 0) {
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
        data: applications,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.APPLICATION_RETRIEVED
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
 * This function handles the API call for showing all approve applications data with pagination
 *
 * @param {IApplicationRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getAllApproveApplications = async (
  req: IApplicationRequest,
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

    const [totalCount, applications] = await Promise.all([
      prisma.application.count({ where: { status: STATUS.APPROVE } }),
      prisma.application.findMany({
        where: { status: STATUS.APPROVE },
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
        include: {
          teamMembers: true,
          images: true,
          backers: true,
        },
      }),
    ]);

    if (!applications || applications.length <= 0) {
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
        data: applications,
        pagination: {
          totalPages,
          currentPage: parsedPage,
          totalResults: totalCount,
          resultsPerPage: parsedLimit,
        },
      },
      VALIDATION_MESSAGES.APPLICATION_RETRIEVED
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

export const getApplicationByOwner = async (
  req: IApplicationRequest,
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

    const application = await prisma.application.findFirst({
      where: {
        usersId: parseInt(userId),
        status: STATUS.APPROVE,
      },
      include: {
        teamMembers: true,
        images: true,
        documents: true,
        socialLinks: true,
        backers: true,
        collections: true,
        users: {
          select: {
            fname: true,
            lname: true,
            email: true,
            description: true,
            profileImage: true,
          },
        },
      },
    });

    if (!application) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      application,
      VALIDATION_MESSAGES.APPLICATION_RETRIEVED
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
 * This function handles the API call for get application data by user
 *
 * @param {IApplicationRequest} req - express request page and limit
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */
export const getApplicationByUser = async (
  req: IApplicationRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }
    const userID: any = req.user?.id ? req.user.id : undefined;

    const application = await prisma.application.findFirst({
      where: {
        usersId: userID,
        // status: STATUS.APPROVE,
      },
      include: {
        teamMembers: true,
        images: true,
        documents: true,
        socialLinks: true,
        backers: true,
      },
    });

    if (!application) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      application,
      VALIDATION_MESSAGES.APPLICATION_RETRIEVED
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
 * This function handles the API call for find application data by specific id
 *
 * @param {IApplicationRequest} req - req application id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const getApplicationByID = async (
  req: IApplicationRequest,
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
      where: {
        applicationUUID: applicationUUID,
      },
      include: {
        teamMembers: true,
        images: true,
        documents: true,
        socialLinks: true,
        backers: true,
        collections: true,
        TaxAuthorities: true,
        users: {
          select: {
            fname: true,
            lname: true,
            email: true,
            description: true,
            profileImage: true,
          },
        },
      },
    });

    if (!application) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );
    }
    // ? need this?
    // if (application.usersId !== Number(req.user?.id))
    //   return ERROR_RESPONSE(
    //     res,
    //     false,
    //     HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
    //     TOKEN_VALIDATION_MESSAGES.NO_ACCESS_OR_MISSING_TOKEN
    //   );

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      application,
      VALIDATION_MESSAGES.APPLICATION_RETRIEVED
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
 * Handles the API call for create application.
 *
 * @param {IApplicationRequest} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<Response>} A response object containing a status, data, and message.
 */
export const createApplication = async (
  req: IApplicationRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }

    const {
      fullName,
      email,
      phoneNumber,
      projectName,
      logoImage,
      roadMapImageURL,
      type,
      // subType,
      goalDescription,
      projectDescription,
      hasBacker,
      backers,
      images,
      dateToGetinTouch,
      teamMembers,
      documents,
      socialLinks,
      description,
      source,
      additionalInfo,
    } = req.body;

    const userID: any = req.user?.id ? req.user.id : undefined;

    // const isApplication = await prisma.application.findFirst({
    //   where: {
    //     usersId: userID,
    //   },
    // });

    // if (isApplication) {
    //   return ERROR_RESPONSE(
    //     res,
    //     false,
    //     HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
    //     VALIDATION_MESSAGES.APPLICATION_ALREADY_EXIST
    //   );
    // }

    const documentTitles = [
      { title: "Title Deed", url: documents.titleDeed },
      { title: "Project Description", url: documents.projectDescription },
      { title: "Business Plan", url: documents.businessPlan },
      { title: "Design Plan", url: documents.designPlan },
      {
        title: "Technical Specification",
        url: documents.technicalSpecification,
      },
    ];

    const application = await prisma.application.create({
      data: {
        fullName,
        projectName,
        email,
        phoneNumber,
        logoImage,
        type,
        // subType,
        goalDescription,
        roadMapImageURL,
        projectDescription,
        hasBacker,
        description: description ? description : undefined,
        source: source ? source : undefined,
        additionalInfo: additionalInfo ? additionalInfo : undefined,
        dateToGetinTouch: new Date(dateToGetinTouch),
        status: STATUS.KYB_PENDING,
        usersId: userID,
        teamMembers: {
          create: teamMembers?.map((tm) => ({
            profileImage: tm.profileImage,
            fullName: tm.fullName,
            position: tm.position,
            contribution: tm.contribution,
            linkedinLink: tm.linkedinLink,
            twitterLink: tm.twitterLink,
            email: tm.email,
            instagramLink: tm.instagramLink,
            facebookLink: tm.facebookLink,
            telegram: tm.telegram,
          })),
        },
        backers: {
          create: backers?.map((backer) => ({
            fullName: backer.fullName,
            email: backer.email,
            website: backer.website,
            telegram: backer.telegram,
            ticketSize: backer.ticketSize,
            amount: backer.amount,
            goalDescription: backer.goalDescription,
          })),
        },
        images: {
          create: images?.map((image) => ({ url: image.url })),
        },
        socialLinks: {
          create: {
            website: socialLinks.website,
            twitter: socialLinks.twitter,
            linkedIn: socialLinks.linkedIn,
            facebook: socialLinks.facebook,
            instagram: socialLinks.instagram,
            youtube: socialLinks.youtube,
            discord: socialLinks.discord,
            telegram: socialLinks.telegram,
          },
        },
        documents: {
          create: documentTitles
            .filter((doc) => doc.url)
            .map((doc) => ({
              titleDeed: doc.title,
              url: doc.url,
            })),
        },
      },
      include: {
        teamMembers: true,
        images: true,
        documents: true,
        socialLinks: true,
        backers: true,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
      application,
      VALIDATION_MESSAGES.CREATE_APPLICATION
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

/*
export const registerByStep1 = async (
    req: IApplicationRequest,
    res: Response,
    _: NextFunction
) => {
    try {
        if (req.method !== REQUEST_METHOD.POST) {
            throw new Error(
                `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
            );
        }

        const {
            fullName,
            email,
            phoneNumber,
            projectName,
            type,
            goalDescription,
            projectDescription,
            socialLinks,
        } = req.body;

        const userID: any = req.user?.id ? req.user.id : undefined;

        const registeredApplication = await prisma.application.findFirst({
            where: {
                usersId: userID,
            },
        });


        let application;
        if (registeredApplication) { // already exists
            // Update the existing application
            application = await prisma.application.update({
                where: {
                    id: registeredApplication.id, // Ensure you're using the correct primary key
                },
                data: {
                    fullName,
                    email,
                    phoneNumber,
                    projectName,
                    type,
                    goalDescription,
                    projectDescription,
                    // Handle updating social links
                    socialLinks: {
                        update: {
                            where: {applicationId: registeredApplication.id}, // Adjust based on your schema
                            data: {
                                website: socialLinks.website,
                                twitter: socialLinks.twitter,
                                linkedIn: socialLinks.linkedIn,
                                facebook: socialLinks.facebook,
                                instagram: socialLinks.instagram,
                                youtube: socialLinks.youtube,
                                discord: socialLinks.discord,
                                telegram: socialLinks.telegram,
                            }
                        }
                    },
                },
                include: {
                    socialLinks: true
                },
            });

            return SUCCESS_RESPONSE(
                res,
                true,
                HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
                application,
                VALIDATION_MESSAGES.UPDATE_APPLICATION
            );


        } else {
            application = await prisma.application.create({
                data: {
                    fullName,
                    email,
                    phoneNumber,
                    projectName,
                    type,
                    goalDescription,
                    projectDescription,
                    status: STATUS.PENDING,
                    usersId: userID,
                    socialLinks: {
                        create: {
                            website: socialLinks.website,
                            twitter: socialLinks.twitter,
                            linkedIn: socialLinks.linkedIn,
                            facebook: socialLinks.facebook,
                            instagram: socialLinks.instagram,
                            youtube: socialLinks.youtube,
                            discord: socialLinks.discord,
                            telegram: socialLinks.telegram,
                        }
                    }
                },
                include: {
                    socialLinks: true
                },
            });
        }

        return SUCCESS_RESPONSE(
            res,
            true,
            HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
            application,
            VALIDATION_MESSAGES.CREATE_APPLICATION
        );
    } catch
        (error) {
        console.error(error);
        logger.error(error);
        return ERROR_RESPONSE(
            res,
            false,
            HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
            error.message
        );
    }
}
*/

/*
export const registerByStep2 = async (
    req: IApplicationRequest,
    res: Response,
    _: NextFunction
) => {
    try {
        if (req.method !== REQUEST_METHOD.POST) {
            throw new Error(
                `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
            );
        }

        const {
            teamMembers,
        }: { teamMembers: TeamMember[] } = req.body;

        const userID: any = req.user?.id ? req.user.id : undefined;

        const registeredApplication = await prisma.application.findFirst({
            where: {
                usersId: userID,
            },
        });

        if (!registeredApplication) {
            throw new Error("please pass step1 first!")
        }

        // Delete existing team members associated with applicationId
        await prisma.teamMember.deleteMany({
            where: {
                applicationId: registeredApplication.id,
            },
        });


        // Upload new profile images to Supabase and prepare team members data
        const newTeamMembers = await Promise.all(
            teamMembers.map(async (member, index) => {

                const file = req.files?.[index];

                if (!file)
                    throw new Error(`Missing profile image for item at index ${index}`);


                const fileName = `${Date.now()}_${file.originalname}`;

                // Upload profile image to Supabase
                const {data, error} = await supabase.storage
                    .from("images")
                    .upload(fileName, file.buffer, {
                        contentType: file.mimetype
                    });

                if (error) {
                    throw new Error(`Failed to upload image for ${member.fullName}: ${error.message}`);
                }

                // Get the public URL of the uploaded image
                const profileImageUrl = supabase.storage
                    .from("images")
                    .getPublicUrl(data.path);

                // Return the new team member object
                return {
                    applicationId: registeredApplication.id,
                    profileImage: profileImageUrl.data.publicUrl,
                    fullName: member.fullName,
                    position: member.position,
                    contribution: member.contribution,
                    linkedinLink: member.linkedinLink,
                    instagramLink: member.instagramLink,
                    facebookLink: member.facebookLink,
                    twitterLink: member.twitterLink,
                    telegram: member.telegram,
                    email: member.email,
                };
            })
        );

        // Add new team members to the application
        await prisma.teamMember.createMany({
            data: newTeamMembers,
        });

        return SUCCESS_RESPONSE(
            res,
            true,
            HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
            newTeamMembers,
            VALIDATION_MESSAGES.UPDATE_APPLICATION
        );


        return SUCCESS_RESPONSE(
            res,
            true,
            HTTP_STATUS_CODE.CREATE_RESPONSE_CODE,
            newTeamMembers,
            VALIDATION_MESSAGES.CREATE_APPLICATION
        );
    } catch
        (error) {
        console.error(error);
        logger.error(error);
        return ERROR_RESPONSE(
            res,
            false,
            HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
            error.message
        );
    }
}
*/

/**
 * This function handles the API call for approve or reject the application  by specific id
 *
 * @param {IApplicationRequest} req - req application id
 * @param {IApplicationRequest} req - req body
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const approveOrRejectApplication = async (
  req: IApplicationRequest,
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
    const applicationID = parseInt(id);

    const { status } = req.body;

    //status will be like pending, approve, rejecte

    const isApplication = await prisma.application.findUnique({
      where: { id: applicationID },
    });
    if (!isApplication) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );
    }

    const application = await prisma.application.update({
      where: { id: applicationID },
      data: {
        status,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      application,
      VALIDATION_MESSAGES.UPDATE_APPLICATION
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
 * This function handles the API call for update application data by specific id
 *
 * @param {IApplicationRequest} req - req application id
 * @param {IApplicationRequest} req - req body
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const updateApplication = async (
  req: IApplicationRequest,
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
    const applicationID = parseInt(id);

    const {
      fullName,
      email,
      phoneNumber,
      logoImage,
      type,
      subType,
      goalDescription,
      projectDescription,
      taxDescription,
      swotImageURL,
      hasBacker,
      backers,
      teamMembers,
      images,
      dateToGetinTouch,
      status,
      roadMap,
      documents,
      roadMapImageURL,
      externalImages,
      internalImages,
      companyAboutUs,
      companyBannerURL,
      socialLinks,
      taxAuthorities,
      description,
      source,
      additionalInfo,
    } = req.body;

    //check if the data is exist on db
    const isApplication = await prisma.application.findUnique({
      where: { id: applicationID },
    });

    if (!isApplication) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );
    }

    // if (
    //   req.user?.role !== Roles.ADMIN &&
    //   isApplication.usersId !== Number(req.user?.id)
    // )
    //   return ERROR_RESPONSE(
    //     res,
    //     false,
    //     HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
    //     VALIDATION_MESSAGES.INVALID_USER
    //   ); //ToDo uncomment if need to enable same user validations

    const safeImages = Array.isArray(images) ? images : [];
    // const safeExternalImages = Array.isArray(externalImages)
    //   ? externalImages
    //   : [];
    // const safeInternalImages = Array.isArray(internalImages)
    //   ? internalImages
    //   : [];
    const safeTeamMembers = Array.isArray(teamMembers) ? teamMembers : [];
    const safeBackers = Array.isArray(backers) ? backers : [];
    const safedocuments = Array.isArray(documents) ? documents : [];
    const taxAuthoritiesData = Array.isArray(taxAuthorities)
      ? taxAuthorities
      : [];

    const application = await prisma.application.update({
      where: { id: applicationID },
      data: {
        fullName,
        email,
        phoneNumber,
        logoImage,
        type,
        subType,
        goalDescription,
        taxDescription,
        swotImageURL,
        projectDescription,
        hasBacker,
        companyAboutUs,
        companyBannerURL,
        description: description ? description : undefined,
        source: source ? source : undefined,
        additionalInfo: additionalInfo ? additionalInfo : undefined,
        externalImages: externalImages,
        internalImages: internalImages,
        dateToGetinTouch: dateToGetinTouch
          ? new Date(dateToGetinTouch)
          : undefined,
        status,
        roadMap,
        roadMapImageURL,
        teamMembers: {
          ...(teamMembers ? { deleteMany: {} } : {}), //  Delete all existing team members
          upsert: safeTeamMembers?.map((tm) => ({
            where: { id: tm.id || -1 },
            update: {
              profileImage: tm.profileImage,
              fullName: tm.fullName,
              position: tm.position,
              contribution: tm.contribution,
              linkedinLink: tm.linkedinLink,
              twitterLink: tm.twitterLink,
              email: tm.email,
              instagramLink: tm.instagramLink,
              facebookLink: tm.facebookLink,
              telegram: tm.telegram,
            },
            create: {
              profileImage: tm.profileImage,
              fullName: tm.fullName,
              position: tm.position,
              contribution: tm.contribution,
              linkedinLink: tm.linkedinLink,
              twitterLink: tm.twitterLink,
              email: tm.email,
              instagramLink: tm.instagramLink,
              facebookLink: tm.facebookLink,
              telegram: tm.telegram,
            },
          })),
        },
        backers: {
          ...(backers ? { deleteMany: {} } : {}),
          upsert: safeBackers?.map((backer) => ({
            where: { id: backer.id || -1 },
            update: {
              fullName: backer.fullName,
              profileImage: backer.profileImage,
              email: backer.email,
              website: backer.website,
              ticketSize: backer.ticketSize,
              amount: backer.amount,
              goalDescription: backer.goalDescription,
              telegram: backer.telegram,
            },
            create: {
              fullName: backer.fullName,
              profileImage: backer.profileImage,
              email: backer.email,
              website: backer.website,
              ticketSize: backer.ticketSize,
              amount: backer.amount,
              goalDescription: backer.goalDescription,
              telegram: backer.telegram,
            },
          })),
        },
        images: {
          upsert: safeImages?.map((img) => ({
            where: { id: img.id || -1 },
            update: { url: img.url },
            create: { url: img.url },
          })),
        },
        socialLinks: {
          update: {
            website: socialLinks?.website,
            twitter: socialLinks?.twitter,
            linkedIn: socialLinks?.linkedIn,
            facebook: socialLinks?.facebook,
            instagram: socialLinks?.instagram,
            youtube: socialLinks?.youtube,
            discord: socialLinks?.discord,
            telegram: socialLinks?.telegram,
          },
        },
        TaxAuthorities: {
          ...(taxAuthorities ? { deleteMany: {} } : {}),
          upsert: taxAuthoritiesData.map((authority) => ({
            where: { id: authority.id || -1 },
            update: {
              question: authority.question,
              answer: authority.answer,
            },
            create: {
              question: authority.question,
              answer: authority.answer,
              // applicationId: authority.applicationId,
            },
          })),
        },
        documents: {
          ...(documents ? { deleteMany: {} } : {}),
          upsert: safedocuments?.map((document) => ({
            where: { id: document.id || -1 },
            update: {
              titleDeed: document.titleDeed,
              url: document.url,
            },
            create: {
              titleDeed: document.titleDeed,
              url: document.url,
            },
          })),
        },
      },
      include: {
        teamMembers: true,
        images: true,
        documents: true,
        socialLinks: true,
        backers: true,
        TaxAuthorities: true,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      application,
      VALIDATION_MESSAGES.UPDATE_APPLICATION
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

export const updateApplicationSocialLinks = async (
  req: IAapplicationSocialLinksRequest,
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
    const applicationID = parseInt(id);

    const {
      twitter,
      linkedIn,
      facebook,
      instagram,
      youtube,
      discord,
      telegram,
    } = req.body;

    const isApplication = await prisma.application.findUnique({
      where: { id: applicationID },
    });

    if (!isApplication) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );
    }

    if (
      req.user?.role !== Roles.ADMIN &&
      isApplication.usersId !== Number(req.user?.id)
    )
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );

    // Check if the social media links record exists on the application
    // If the record doesn't exist then insert new record
    // If the record exists update

    const existingSocialMediaLinks = await prisma.socialMediaLinks.findUnique({
      where: { applicationId: applicationID },
    });

    if (!existingSocialMediaLinks) {
      const newSocialMediaLinks = await prisma.socialMediaLinks.create({
        data: {
          applicationId: applicationID,
          twitter,
          linkedIn,
          facebook,
          instagram,
          youtube,
          discord,
          telegram,
        },
      });

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        newSocialMediaLinks,
        VALIDATION_MESSAGES.UPDATE_APPLICATION_SOCIAL_LINKS
      );
    }

    const socialMediaLinks = await prisma.socialMediaLinks.update({
      where: { applicationId: applicationID },
      data: {
        twitter,
        linkedIn,
        facebook,
        instagram,
        youtube,
        discord,
        telegram,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      socialMediaLinks,
      VALIDATION_MESSAGES.UPDATE_APPLICATION_SOCIAL_LINKS
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

export const updateApplicationTeamMembers = async (
  req: IAapplicationTeamMembersRequest,
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
    const applicationID = parseInt(id);

    const { teamMembers } = req.body;
    // team memmber req body example
    // "teamMembers": [
    //   {
    //     "id": 1, // Update an existing team member with ID 1
    //     "fullName": "Updated Name",
    //     "position": "Updated Position",
    //     "contribution": "Updated Contribution",              // exist user format
    //     "linkedinLink": "https://updated-linkedin.com",
    //     "twitterLink": "https://updated-twitter.com"
    //   },
    //   {
    //     "fullName": "New Team Member",
    //     "position": "New Position",
    //     "contribution": "New Contribution",                 //new user format
    //     "linkedinLink": "https://new-linkedin.com",
    //     "twitterLink": "https://new-twitter.com"
    //   }
    // ],

    //check if the data is exist on db
    const isApplication = await prisma.application.findUnique({
      where: { id: applicationID },
      include: {
        teamMembers: true,
      },
    });

    if (!isApplication) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );
    }

    if (
      req.user?.role !== Roles.ADMIN &&
      isApplication.usersId !== Number(req.user?.id)
    )
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );

    const application = await prisma.application.update({
      where: { id: applicationID },
      data: {
        teamMembers: {
          // https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#upsert
          upsert: teamMembers.map((tm) => ({
            where: { id: tm.id || -1 },
            update: {
              profileImage: tm.profileImage,
              fullName: tm.fullName,
              position: tm.position,
              contribution: tm.contribution,
              linkedinLink: tm.linkedinLink,
              twitterLink: tm.twitterLink,
            },
            create: {
              profileImage: tm.profileImage,
              fullName: tm.fullName,
              position: tm.position,
              contribution: tm.contribution,
              linkedinLink: tm.linkedinLink,
              twitterLink: tm.twitterLink,
            },
          })),
        },
      },
      include: {
        socialLinks: true,
        teamMembers: true,
        images: true,
      },
    });

    //check the team members records are on the request body
    // Delete the team members records that are no longer in the request
    await prisma.teamMember.deleteMany({
      where: {
        id: {
          in: isApplication.teamMembers
            .map((teamMember) => teamMember.id)
            .filter(
              (existingTeamMemberId) =>
                !teamMembers.some(
                  (newTeamMember) => newTeamMember.id === existingTeamMemberId
                )
            ),
        },
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      application,
      VALIDATION_MESSAGES.UPDATE_APPLICATION_TEAM_MEMBERS
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

export const updateApplicationBackers = async (
  req: IAapplicationBackersRequest,
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
    const applicationID = parseInt(id);

    const { backers } = req.body;

    // team memmber req body example
    // "backers": [
    //   {
    //     "id": 1, // Update an existing team member with ID 1
    //     "fullName": "test full name",
    //     "profileImage": "https://profile-image.com",
    //     "email": "test@gmail.com",
    //     "ticketSize": 20,                              // exist user format
    //     "website": "https://websitelink.com",
    //     "amount": 10
    //     "goalDescription":"djsatduagjhdgsajh"
    //   },
    //   {
    //     "fullName": "test full name",
    //     "profileImage": "https://profile-image.com",
    //     "email": "test@gmail.com",
    //     "ticketSize": 20,                               //new user format
    //     "website": "https://websitelink.com",
    //     "amount": 10
    //     "goalDescription":"djsatduagjhdgsajh"
    //   }
    // ],

    //check if the data is exist on db
    const isApplication = await prisma.application.findUnique({
      where: { id: applicationID },
      include: {
        backers: true,
      },
    });

    if (!isApplication) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );
    }

    if (
      req.user?.role !== Roles.ADMIN &&
      isApplication.usersId !== Number(req.user?.id)
    )
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );

    const application = await prisma.application.update({
      where: { id: applicationID },
      data: {
        backers: {
          // https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#upsert
          upsert: backers.map((backer) => ({
            where: { id: backer.id || -1 },
            update: {
              fullName: backer.fullName,
              profileImage: backer.profileImage,
              email: backer.email,
              website: backer.website,
              ticketSize: backer.ticketSize,
              amount: backer.amount,
              goalDescription: backer.goalDescription,
            },
            create: {
              fullName: backer.fullName,
              profileImage: backer.profileImage,
              email: backer.email,
              website: backer.website,
              ticketSize: backer.ticketSize,
              amount: backer.amount,
              goalDescription: backer.goalDescription,
            },
          })),
        },
      },
      include: {
        socialLinks: true,
        teamMembers: true,
        images: true,
      },
    });

    //check the team members records are on the request body
    // Delete the team members records that are no longer in the request
    await prisma.backers.deleteMany({
      where: {
        id: {
          in: isApplication.backers
            .map((backer) => backer.id)
            .filter(
              (existingBackerId) =>
                !backers.some((newBacker) => newBacker.id === existingBackerId)
            ),
        },
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      application,
      VALIDATION_MESSAGES.UPDATE_APPLICATION_BACKERS
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

export const updateApplicationImages = async (
  req: IAapplicationImagesRequest,
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
    const applicationID = parseInt(id);

    const { images } = req.body;

    // team memmber req body example
    // "images": [
    //   {
    //     "id": 1, // Update an existing team member with ID 1
    //     "url":"www.exampleimage.com"
    //   },
    //   {
    //    "url":"www.exampleimage.com"
    //   }
    // ],

    //check if the data is exist on db
    const isApplication = await prisma.application.findUnique({
      where: { id: applicationID },
      include: {
        images: true,
      },
    });

    if (!isApplication) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );
    }

    if (
      req.user?.role !== Roles.ADMIN &&
      isApplication.usersId !== Number(req.user?.id)
    )
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );

    const application = await prisma.application.update({
      where: { id: applicationID },
      data: {
        images: {
          // https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#upsert
          upsert: images.map((img) => ({
            where: { id: img.id || -1 },
            update: {
              url: img.url,
            },
            create: {
              url: img.url,
            },
          })),
        },
      },
      include: {
        socialLinks: true,
        teamMembers: true,
        images: true,
      },
    });

    //check the images records are on the request body
    // Delete the images records that are no longer in the request
    await prisma.media.deleteMany({
      where: {
        id: {
          in: isApplication.images
            .map((img) => img.id)
            .filter(
              (existingImageId) =>
                !images.some((newImg) => newImg.id === existingImageId)
            ),
        },
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      application,
      VALIDATION_MESSAGES.UPDATE_APPLICATION_IMAGES
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

export const deleteImage = async (
  req: IAapplicationImagesRequest,
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
    const imageID = parseInt(id);

    //check if the data is exist on db
    const isImage = await prisma.media.findUnique({
      where: { id: imageID },
    });

    if (!isImage) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_IMAGE
      );
    }

    if (req.user?.role !== Roles.ADMIN) {
      const readersApplication = await prisma.application.findFirst({
        where: { usersId: Number(req.user?.id) },
      });

      if (readersApplication?.id !== isImage.applicationId)
        return ERROR_RESPONSE(
          res,
          false,
          HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
          VALIDATION_MESSAGES.INVALID_APPLICATION
        );
    }

    const image = await prisma.media.delete({ where: { id: imageID } });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      image,
      VALIDATION_MESSAGES.DELETE_APPLICATION_IMAGE
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

export const deleteBacker = async (
  req: IAapplicationBackersRequest,
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
    const backerID = parseInt(id);

    //check if the data is exist on db
    const hasBacker = await prisma.backers.findUnique({
      where: { id: backerID },
    });

    if (!hasBacker) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_BACKERS
      );
    }

    if (req.user?.role !== Roles.ADMIN) {
      const readersApplication = await prisma.application.findFirst({
        where: { usersId: Number(req.user?.id) },
      });

      if (readersApplication?.id !== hasBacker.applicationId)
        return ERROR_RESPONSE(
          res,
          false,
          HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
          VALIDATION_MESSAGES.INVALID_APPLICATION
        );
    }

    const backer = await prisma.backers.delete({ where: { id: backerID } });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      backer,
      VALIDATION_MESSAGES.DELETE_APPLICATION_BACKERS
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

export const deleteTeamMember = async (
  req: IAapplicationBackersRequest,
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
    const teamMemberID = parseInt(id);

    //check if the data is exist on db
    const isTeamMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberID },
    });

    if (!isTeamMember) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_TEAM_MEMBER
      );
    }

    // make sure that user can't delete members from other teams
    if (req.user?.role !== Roles.ADMIN) {
      const readersApplication = await prisma.application.findFirst({
        where: { usersId: Number(req.user?.id) },
      });

      if (readersApplication?.id !== isTeamMember.applicationId)
        return ERROR_RESPONSE(
          res,
          false,
          HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
          VALIDATION_MESSAGES.INVALID_APPLICATION
        );
    }

    const teamMember = await prisma.teamMember.delete({
      where: { id: teamMemberID },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      teamMember,
      VALIDATION_MESSAGES.DELETE_APPLICATION_TEAM_MEMBER
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
 * This function handles the API call for delete application data by specific id
 *
 * @param {IApplicationRequest} req - req body
 * @param {IApplicationRequest} req - req application id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const deleteApplication = async (
  req: IApplicationRequest,
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
    const applicationID = parseInt(id);

    const isApplication = await prisma.application.findUnique({
      where: {
        id: applicationID,
      },
    });

    if (!isApplication) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );
    }

    if (
      req.user?.role !== Roles.ADMIN &&
      isApplication.usersId !== Number(req.user?.id)
    )
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.UNAUTHORIZED_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_APPLICATION
      );

    const application = await prisma.application.delete({
      where: { id: applicationID },
      include: {
        teamMembers: true,
        images: true,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      application,
      VALIDATION_MESSAGES.DELETE_APPLICATION
    );
  } catch (error) {
    logger.error(error);
    console.error(error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.SERVER_INTERNAL_ERROR_RESPONSE_CODE,
      error.message
    );
  }
};

export const getBookedSlost = async (
  req: IApplicationRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const { date } = req.params;
    const appointmentDate = new Date(date as string);
    const start = startOfDay(appointmentDate);
    const end = endOfDay(appointmentDate);

    const appointmentsForDay = await prisma.application.findMany({
      where: {
        dateToGetinTouch: {
          gte: start,
          lt: end,
        },
      },
      select: {
        dateToGetinTouch: true,
      },
    });

    const hours = appointmentsForDay.map((app) => app.dateToGetinTouch);

    const uniqueHours = [...new Set(hours)];

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      uniqueHours,
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
