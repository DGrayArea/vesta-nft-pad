import { Response, NextFunction } from "express";
import prisma from "../common/prisma-client";
import {
  HTTP_STATUS_CODE,
  MESSAGES,
  REQUEST_METHOD,
} from "../common/constants";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "../helpers/responseHelpers";
import { IPropertyRequest } from "../helpers/Interface";
import { logger } from "../helpers/loggers";
import { subMinutes } from "date-fns";
import {
  checkCreditsExistForUser,
  updateUsageForUser,
} from "./subscriptionController";

/**
 * Handles the API call to retrieve property prices.
 *
 * @param {IPropertyRequest} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<Response>} A response object containing a status, data, and message.
 */
export const getPropertyPrices = async (
  req: IPropertyRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }

    const { type } = req.params;

    const user = req.user;

    // construct request url
    const PROPERTY_REQUEST_URL = getPropertyRequestUrl(type, req.body);

    // Find if previous search log already exists within 30 mins
    const propertyDataLogRecExist = await prisma.propertyDataLog.findFirst({
      where: {
        requestPath: type,
        requestParams: {
          equals: JSON.stringify(req.body),
        },
        created_at: {
          gte: subMinutes(
            new Date(),
            Number(process.env.PROPERTY_LOG_EXPIRE_TIME)
          ),
        },
      },
      select: {
        data: true,
      },
    });

    let loggedData;

    // fetch data and log the data in the database
    if (!propertyDataLogRecExist) {
      // Return error if credit insufficient and not in pay as you go plan
      if (
        !(await checkCreditsExistForUser(
          Number(user?.id),
          getCreditsForRequest(type, req.body?.results)
        ))
      ) {
        return ERROR_RESPONSE(
          res,
          false,
          HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
          "Credit insufficient!"
        );
      }

      // clean up log table
      loggedData = await prisma.propertyDataLog.deleteMany({
        where: {
          requestPath: type,
          requestParams: {
            equals: JSON.stringify(req.body),
          },
        },
      });

      // Fetch data from property API
      (await fetch(PROPERTY_REQUEST_URL))
        .json()
        .then(async (propertyData) => {
          if (propertyData && propertyData?.status == "success") {
            // Deduct credit balance from the subscripton of the user if propertyData.status == "success" here
            await updateUsageForUser(
              Number(user?.id),
              getCreditsForRequest(type, req.body?.results)
            );

            let apiData = JSON.stringify(propertyData?.data);

            if (type.includes("growth")) {
              apiData = JSON.stringify(
                propertyData?.data.map((item) => {
                  return {
                    date: item[0],
                    growth_number: item[1],
                    percentage: item[2],
                  };
                })
              );
            }

            loggedData = await prisma.propertyDataLog.create({
              data: {
                requestPath: type,
                requestParams: JSON.stringify(req.body),
                data: apiData,
                userId: Number(user?.id),
              },
              select: {
                data: true,
              },
            });

            return SUCCESS_RESPONSE(
              res,
              true,
              HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
              loggedData.data,
              MESSAGES.DATA_SUCCESS
            );
          }
          console.log(propertyData);
          return ERROR_RESPONSE(
            res,
            false,
            HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
            MESSAGES.RESULT_NOT_FOUND
          );
        })
        .catch((err) => {
          console.log(err);
          return ERROR_RESPONSE(
            res,
            false,
            HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
            MESSAGES.RESULT_NOT_FOUND
          );
        });
    } else {
      loggedData = propertyDataLogRecExist;

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        loggedData.data,
        MESSAGES.DATA_SUCCESS
      );
    }
  } catch (error) {
    console.error(error);
    logger.error(error);
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
      error.message
    );
  }
};

// get credits required for the request
const getCreditsForRequest = (type: string, results?: number) => {
  if (type == "sourced-properties" || type == "planning")
    return Math.ceil(Number(results) / 10);
  else if (type == "postcode-key-stats") return 30;
  else return 1;
};

// construct property request url
const getPropertyRequestUrl = (path, payload) => {
  const {
    postCode,
    bedrooms,
    type,
    points,
    min_sqf,
    max_sqf,
    prop_class,
    tenure,
    max_age,
    decision_rating,
    category,
    max_age_update,
    results,
    radius,
    phase,
    region,
    list,
    property_id,
  } = payload;

  let REQUEST_URL = `https://api.propertydata.co.uk/${path}?key=${process.env.PROPERTY_API_KEY}&postcode=${postCode}`;

  if (bedrooms) REQUEST_URL += `&bedrooms=${bedrooms}`;
  if (type) REQUEST_URL += `&type=${type}`;
  if (points) REQUEST_URL += `&points=${points}`;
  if (min_sqf) REQUEST_URL += `&min_sqf=${min_sqf}`;
  if (max_sqf) REQUEST_URL += `&max_sqf=${max_sqf}`;
  if (prop_class) REQUEST_URL += `&class=${prop_class}`;
  if (tenure) REQUEST_URL += `&tenure=${tenure}`;
  if (max_age) REQUEST_URL += `&max_age=${max_age}`;
  if (decision_rating) REQUEST_URL += `&decision_rating=${decision_rating}`;
  if (category) REQUEST_URL += `&category=${category}`;
  if (max_age_update) REQUEST_URL += `&max_age_update=${max_age_update}`;
  if (results) REQUEST_URL += `&results=${results}`;
  if (radius) REQUEST_URL += `&radius=${radius}`;
  if (phase) REQUEST_URL += `&phase=${phase}`;
  if (region) REQUEST_URL += `&region=${region}`;
  if (list) REQUEST_URL += `&list=${list}`;
  if (property_id) REQUEST_URL += `&property_id=${property_id}`;

  return REQUEST_URL;
};
