export const STATUS_MESSAGE = {
  SUCCESS: "Success",
  FAILED: "Failed",
  SERVER_ERROR: "Server error",
  DATABASE_ERROR: "Something wrong with the DB",
  DATABASE_LIVE: "DATABASE is live",
  REQUEST_VALIDATION_FAILED: "Request Validation Failed",
  ERROR_MESSAGE: "Oops, Something went wrong",
};

export const REQUEST_METHOD = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
};

export const HTTP_STATUS_CODE = {
  SUCCESS_RESPONSE_CODE: 200,
  CREATE_RESPONSE_CODE: 201,
  BAD_REQUEST_RESPONSE_CODE: 400,
  UNAUTHORIZED_RESPONSE_CODE: 401,
  FORBIDDEN_RESPONSE_CODE: 403,
  NOT_FOUND_RESPONSE_CODE: 404,
  CONFLICT_RESPONSE_CODE: 409,
  SERVER_INTERNAL_ERROR_RESPONSE_CODE: 500,
  NOT_IMPLEMENTED_RESPONSE_CODE: 500,
  BAD_GATEWAY_RESPONSE_CODE: 502,
};

export const MESSAGES = {
  CREATED: "Successfully Created",
  UPDATED: "Successfully Updated",
  DELETED: "Successfully Deleted",
  TEMPORARY_DELETED: "Successfully Temporary Deleted",
  DATA_SUCCESS: "Data Succesfully Retrieved",
  ALREADY_EXIST: "Data Already Exist",
  RESULT_NOT_FOUND: "Data Not Found",
};

export const SUBSCRIPTION_MESSAGES = {
  CREATED: "Successfully Subscribed",
  ADDED_PAYMENT: "Successfully added payment method",
  UPDATED: "Successfully Updated subscription",
  DELETED: "Successfully Deleted",
  CANCELLED: "Successfully Cancelled subscription",
  TEMPORARY_DELETED: "Successfully Temporary Deleted",
  DATA_SUCCESS: "Data Succesfully Retrieved",
  ALREADY_EXIST: "Data Already Exist",
  RESULT_NOT_FOUND: "Data Not Found",
};

export const VALIDATION_MESSAGES = {
  KYC_LINK_GENERATED: "KYC link generated successfully",
  KYC_STATUS_RETRIEVED: "KYC status retrieved successfully",
  KYB_LINK_GENERATED: "KYB link generated successfully",
  KYB_STATUS_RETRIEVED: "KYB status retrieved successfully",
  APPLICATION_NOT_FOUND: "Application Not Found",
  CONTRACT_DEPLOYED: "Contract Deployed Successfully",
  BID_ACCEPT: "Bid Accepted Successfully",
  BID_WITHDRAW: "Bid Withdraw Successfully",
  INVALID_USER: "Invalid User",
  INVALID_PASSWORD: "Invalid Password",
  INVALID_BID: "Invalid Bid",
  USER_NOT_FOUND: "Users Not Found",
  BID_NOT_FOUND: "Bids Not Found",
  BID_PLACED_SUCCESS: "Bids Placed Successfully",
  USER_ALREADY_EXIST: "User Already Exist",
  USER_RETRIEVED: "User Successfully Retrieved",
  BID_RETRIEVED: "Bids Successfully Retrieved",
  BID_ALREADY_EXIST: "You have already bid on this nft",
  UPDATE_USER: "User Successfully Updated",
  DELETE_USER: "User Successfully Deleted",
  PASSWORD_DO_NOT_MATCH: "New password and confirm password do not match",
  EMAIL_DO_NOT_MATCH: "New email and confirm email do not match",
  INVALID_CURRENT_PASSWORD: "Invalid current password",
  INVALID_CURRENT_EMAIL: "Invalid current email",
  PASSWORD_CHANGE: "Password updated successfully",

  NEWS_SETTINGS: "News Settings Updated Successfully",
  TERMS_AND_CONDITION_SETTINGS: "Terms Settings Updated Successfully",
  PRIVACY_SETTINGS: "Privacy Settings Updated Successfully",
  ACCOUNT_VISIBILITY_SETTINGS:
    "Account Visibility Settings Updated Successfully",

  REQUEST_CORRECTION_RETRIEVED: "Request Correction Successfully Retrieved",
  REQUEST_CORRECTION_SUBMITTED: "Request Correction Submitted Successfully",
  REQUEST_CORRECTION_STATUS_UPDATE:
    "Request for Correction Status Changed Successfully",
  INVALID_REQUEST_CORRECTION: "Invalid Request Correction",
  UPDATE_CORRECTION_REQUEST: "Correction request updated",

  DOCUMENT_RETRIEVED: "Document Successfully Retrieved",
  DOCUMENT_ALREADY_EXIST: "Document Already Exist",
  CREATE_DOCUMENT: "Document Successfully Created",
  UPDATE_DOCUMENT: "Document Successfully Updated",
  DELETE_DOCUMENT: "Document Successfully Deleted",

  INVALID_APPLICATION: "Invalid Application",
  INVALID_BACKERS: "Invalid Backer",
  INVALID_IMAGE: "Invalid Image",
  INVALID_TEAM_MEMBER: "Invalid Team Member",
  APPLICATION_RETRIEVED: "Application Successfully Retrieved",
  APPLICATION_ALREADY_EXIST: "Application Already Exist",
  CREATE_APPLICATION: "Application Successfully Created",
  UPDATE_APPLICATION: "Application Successfully Updated",
  UPDATE_APPLICATION_TEAM_MEMBERS: "Team Members Successfully Updated",
  UPDATE_APPLICATION_BACKERS: "Backers Successfully Updated",
  UPDATE_APPLICATION_IMAGES: "Images Successfully Updated",
  UPDATE_APPLICATION_SOCIAL_LINKS: "Social Links Successfully Updated",
  DELETE_APPLICATION: "Application Successfully Deleted",
  DELETE_APPLICATION_BACKERS: "Backer Successfully Deleted",
  DELETE_APPLICATION_IMAGE: "Image Successfully Deleted",
  DELETE_APPLICATION_TEAM_MEMBER: "Team Member Successfully Deleted",

  INVALID_COLLECTION: "Invalid Collection",
  COLLECTION__NOT_FOUND: "Collection Not Found",
  COLLECTION_RETRIEVED: "Collection Successfully Retrieved",
  COLLECTION_ALREADY_EXIST: "Collection Name Already Exist",
  CREATE_COLLECTION: "Collection Successfully Created",
  UPDATE_COLLECTION: "Collection Successfully Updated",
  DELETE_COLLECTION: "Collection Successfully Deleted",
  STATS_COLLECTION_SUCCESS: "Collection Stats Successfully retrieved",

  INVALID_REFF_CODE: "Invalid Refarral Code",
  REFF_CODE_NOT_FOUND: "Reffaral Code Not Found",
  REFF_CODE_RETRIEVED: "Refarral Code Successfully Retrieved",
  REFFERAL_RETRIEVED: "Refarral Successfully Retrieved",
  REFF_ALREADY_EXIST: "Refarral Code Already Exist",
  REFF_ALREADY_EXIST_FOR_USER: "User Already Has A Refarral Code",
  CREATE_REFF: "Refarral Code Successfully Created",
  UPDATE_REFF: "Refarral Code Successfully Updated",
  DELETE_REFF: "Refarral Code Successfully Deleted",

  INVALID_METADATA: "Invalid Metadata",
  METADATA_RETRIEVED: "Metadata Successfully Retrieved",
  TOKEN_NOT_MINTED: "The token has not been minted yet.",
  METADATA_ALREADY_EXIST: "Metadata Name Already Exist",
  CREATE_METADATA: "Metadata Successfully Created",
  UPDATE_METADATA: "Metadata Successfully Updated",
  DELETE_METADATA: "Metadata Successfully Deleted",

  INVALID_LINKWALLET: "Invalid Wallet",
  LINKWALLET_RETRIEVED: "Wallet Successfully Retrieved",
  LINKWALLET_ALREADY_EXIST: "Wallet Name Already Exist",
  CREATE_LINKWALLET: "Wallet Successfully Created",
  UPDATE_LINKWALLET: "Wallet Successfully Updated",
  DELETE_LINKWALLET: "Wallet Successfully Deleted",

  FILE_UPLOAD_URL: "File Upload Successfully",

  INVALID_POST: "Invalid Post",
  POST_RETRIEVED: "Post Successfully Retrieved",
  POST_ALREADY_EXIST: "Post Name Already Exist",
  CREATE_POST: "Post Successfully Created",
  UPDATE_POST: "Post Successfully Updated",
  DELETE_POST: "Post Successfully Deleted",

  INVALID_JOB: "Invalid Job",
  JOB_RETRIEVED: "Job Successfully Retrieved",
  JOB_ALREADY_EXIST: "Job Already Exist",
  CREATE_JOB: "Job Successfully Created",
  UPDATE_JOB: "Job Successfully Updated",
  DELETE_JOB: "Job Successfully Deleted",

  INVALID_FAQ: "Invalid Faq",
  FAQ_RETRIEVED: "Faq Successfully Retrieved",
  FAQ_ALREADY_EXIST: "Faq Already Exist",
  CREATE_FAQ: "Faq Successfully Created",
  UPDATE_FAQ: "Faq Successfully Updated",
  DELETE_FAQ: "Faq Successfully Deleted",

  INVALID_TAX: "Invalid Tax Authority",
  TAX_RETRIEVED: "Tax Authority Successfully Retrieved",
  CREATE_TAX: "Tax Authority Successfully Created",
  UPDATE_TAX: "Tax Authority Successfully Updated",
  DELETE_TAX: "Tax Authority Successfully Deleted",
  TAX_ALREADY_EXIST: "Tax Authority Already Exist",
  NO_TAX_EXIST: "No Tax authorities for this company",

  INVALID_SWOT: "Invalid SWOT",
  SWOT_RETRIEVED: "SWOT Successfully Retrieved",
  CREATE_SWOT: "SWOT Successfully Created",
  UPDATE_SWOT: "SWOT Successfully Updated",
  DELETE_SWOT: "SWOT Successfully Deleted",
  SWOT_ALREADY_EXIST: "SWOT Already Exist",
  NO_SWOT_EXIST: "No SWOT for this company",

  INVALID_LISTING: "Invalid Listing",
  LISTING_RETRIEVED: "Listing Successfully Retrieved",
  CONTRACT_LISTING_RETRIEVED: "Contract Listing Successfully Retrieved",
  LISTING_ALREADY_EXIST: " Already Listed",
  CREATE_LISTING: "Successfully Listed ",
  DE_LISTING: "Successfully DE-Listed ",
  PLACE_BID: "Bid Successfully Placed",
  ACCEPT_BID: "Bid Successfully Accepted",
  WITHDRAW_BID: "Bid Successfully Withdrawn",
  UPDATE_LISTING: "Listing Successfully Updated",
  DELETE_LISTING: "Listing Successfully Deleted",
  PURCHASE_SUCCESS: "NFT purchased successfully",
  LISTING_NOT_FOUND: "Listing not found",
  LISTING_NOT_AVAILABLE: "This listing is not available for purchase",
  COLLECTION_FLOOR_PRICE_AND_VOLUME_RETRIEVED:
    "Collection floor price and volume retrieved successfully.",

  NFT_LIKE_SUCCESS: "NFT Like Successfully",
  NFT_UNLIKE_SUCCESS: "NFT Unlike Successfully",
  NFT_NOT_FOUND: "NFT Not Found",
  NFT_ALREADY_LIKED: "This wallet has already liked this NFT",
  NFT_NOT_LIKED:
    "Oops! It seems you haven't liked this NFT yet. Please go ahead and give it a like before trying to unlike it.",

  TRANSACTION_RETRIEVED: "Transaction Successfully Retrieved",
  INVALID_TRANSACTION: "Invalid Transaction",
};

export const TOKEN_VALIDATION_MESSAGES = {
  MISSING_SIGNATURE:
    "Authorization token is missing. Please provide a valid token.",
  INVALID_SIGNATURE:
    "Authorization validation failed. Please check your signature.",

  NO_ACCESS: "You are not Authorized",
  TOKEN_MISSING: "Missing token",
  NO_ACCESS_OR_MISSING_TOKEN: "You are not Authorized or Missing token",
  INVALID_TOKEN: "Invalid Token",
  INVALID_TOKEN_OR_EXPIRED: "Invalid Token or Expired",
};

export const STATUS = {
  PENDING: "PENDING",
  APPROVE: "APPROVED",
  REJECT: "REJECT",
  KYB_PENDING: "KYB_PENDING",
};

export const ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
};

export const PURCHASE_STATUS = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
};

export const TRANSACTION_METHODS = {
  BID_ACCEPTED: "BidAccept",
  PURCHASE_NFT: "purchaseNft",
  CONTRACT_DEPLOY: "contractDeploy",
  BID_WITHDRAW: "BidWithdraw",
  BID_PLACED: "BidPlaced",
};

// ========================= SWAGGER-CONFIG ========================= //

export const SWAGGER_OPTIONS = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vesta BACKEND API",
      version: "1.0.0",
      description: "",
    },
    servers: [
      {
        url: `http://localhost:${5000}/api/v1/`,
      },
      {
        url: `${process.env.API_BASE_URL}/api/v1`,
      },
    ],
    tags: [
      {
        name: "Launchpad Application",
        description: "API related to launchpad registration",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
          description:
            'JWT authorization header using the Bearer scheme. Example: "Bearer {token}"',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    schemes: ["http", "https"],
  },
  apis: ["./src/routes/*.ts"], // Path to your API files
};
// ========================= enums ========================= //
export enum AuctionStatus {
  FUTURE_AUCTION,
  ACTIVE,
  ENDED,
}
