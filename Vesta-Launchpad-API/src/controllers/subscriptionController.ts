import { Response, NextFunction } from "express";
import stripeAPI from "stripe";
import prisma from "../common/prisma-client";
import {
  HTTP_STATUS_CODE,
  REQUEST_METHOD,
  SUBSCRIPTION_MESSAGES,
} from "../common/constants";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "../helpers/responseHelpers";
import { IPaymentRequest } from "../helpers/Interface";
import { logger } from "../helpers/loggers";

const stripe = new stripeAPI(String(process.env.STRIPE_SECRET_KEY)); // initialize stripe API

/**
 * Handles the API call for create subscription.
 *
 * @param {IPaymentRequest} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<Response>} A response object containing a status, data, and message.
 */
export const createSubscription = async (
  req: IPaymentRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }

    const { packageId } = req.body;

    // Retrieve user and subscription package from the database
    const user: any = req.user;

    const subsPackage = await prisma.subscriptionPackage.findUnique({
      where: {
        id: Number(packageId),
      },
    });

    if (!user || !subsPackage) {
      return res.status(404).json({ error: "User or package not found" });
    }

    let stripeCustomer = {
      id: "",
    };

    // Create a customer in Stripe if not exist
    if (user?.stripeId) {
      stripeCustomer.id = user.stripeId;
    } else {
      stripeCustomer = await stripe.customers.create({
        email: user.email || "",
      });
      await prisma.users.update({
        where: {
          id: user?.id,
        },
        data: {
          stripeId: stripeCustomer.id,
        },
      });
    }

    // Check if the user has a default payment method
    let isPaymentMethodAvailable = false;
    if (stripeCustomer.id) {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomer.id,
        type: "card",
      });
      isPaymentMethodAvailable = paymentMethods.data.length > 0;
    }

    // If payment method is not available, return response with isPaymentMethodAvailable: false
    if (!isPaymentMethodAvailable) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "No payment method available",
        {
          isPaymentMethodAvailable: false,
        }
      );
    }

    // Fetch existing subscriptions for the customer
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: stripeCustomer.id,
      status: "active",
    });

    // Remove existing subscriptions
    for (const existingSub of existingSubscriptions.data) {
      await stripe.subscriptions.cancel(existingSub.id, {
        invoice_now: true,
      });
    }

    // Invalidate old subscriptions
    await prisma.subscription.updateMany({
      where: {
        userId: user.id,
      },
      data: {
        isActive: false,
      },
    });

    // Create a subscription in Stripe
    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      items: [{ price: String(subsPackage?.stripePriceId) }], // Use the Stripe Price ID associated with the package
      metadata: {
        userId: user.id,
        packageId: subsPackage.id,
      },
    });

    // Update user's subscription in the database
    const subscription = await prisma.subscription.create({
      data: {
        userId: user?.id,
        subscriptionPackageId: subsPackage.id,
        startDate: new Date(),
        endDate: new Date(),
        isActive: true,
        activationDate: new Date(),
        stripeSubscriptionId: stripeSubscription.id,
        stripeSubscriptionItemId: stripeSubscription.items.data[0].id,
        creditBalance: subsPackage.creditAmount,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      {
        userId: subscription.userId,
        subscriptionPackageId: subscription.subscriptionPackageId,
        isActive: subscription.isActive,
        activationDate: subscription.activationDate,
      },
      SUBSCRIPTION_MESSAGES.CREATED
    );
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

/**
 * Handles the API call to add payment method.
 *
 * @param {IPaymentRequest} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<Response>} A response object containing a status, data, and message.
 */
export const addPaymentMethod = async (
  req: IPaymentRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.POST) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.POST} Allowed`
      );
    }
    const userId: any = req.user?.id ? req.user.id : undefined;

    // Retrieve user and subscription package from the database
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    const { paymentMethodId, packageId } = req.body;

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: String(user?.stripeId),
    });

    // Set the attached payment method as the default for the customer
    await stripe.customers.update(String(user?.stripeId), {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    if (packageId)
      createSubscription(req, res, () => {
        return SUCCESS_RESPONSE(
          res,
          true,
          HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
          {},
          SUBSCRIPTION_MESSAGES.ADDED_PAYMENT
        );
      });
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

/**
 * Handles the API call to get all subscription packages method.
 *
 * @param {IPaymentRequest} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<Response>} A response object containing a status, data, and message.
 */
export const getAllSubscriptions = async (
  req: IPaymentRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    const allSubscriptionPackages = await prisma.subscriptionPackage.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        duration: true,
        description: true,
        creditAmount: true,
        stripePriceId: false,
      },
    });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      allSubscriptionPackages,
      SUBSCRIPTION_MESSAGES.DATA_SUCCESS
    );
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

/**
 * Handles the API call to get all subscription for user method.
 *
 * @param {IPaymentRequest} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<Response>} A response object containing a status, data, and message.
 */
export const getAllUserSubscriptions = async (
  req: IPaymentRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }

    // Retrieve user and subscription package from the database
    const user: any = req.user;

    const allSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: user?.id,
      },
      include: {
        subscriptionPackage: true,
      },
    });

    const data = {
      creditBalance: allSubscriptions.find((item) => item.isActive)
        ?.creditBalance,
      activeSubscription: allSubscriptions.find((item) => item.isActive),
      allSubscriptions: allSubscriptions,
    };

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      data,
      SUBSCRIPTION_MESSAGES.DATA_SUCCESS
    );
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

/**
 * Handles the API call to cancel subscription method.
 *
 * @param {IPaymentRequest} req - The request object.
 * @param {Response} res - The response object
 * @returns {Promise<Response>} A response object containing a status, data, and message.
 */
export const cancelSubscripton = async (
  req: IPaymentRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    const { subscriptionId } = req.body;

    // Get stripe subscription Id
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
      },
    });

    // Cancel subscription in stripe
    const deletedSubscription = await stripe.subscriptions.cancel(
      String(subscription?.stripeSubscriptionId),
      {
        invoice_now: true,
      }
    );

    // Update db with canceled subscription
    if (deletedSubscription)
      await prisma.subscription.update({
        where: {
          id: subscriptionId,
        },
        data: {
          isActive: false,
        },
      });

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      null,
      SUBSCRIPTION_MESSAGES.CANCELLED
    );
  } catch (error) {
    return ERROR_RESPONSE(
      res,
      false,
      HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
      error?.message
    );
  }
};

/**
 * Deducts the specified credit amount from the user's subscription.
 *
 * @param userId - The ID of the user whose credit will be deducted.
 * @param creditAmount - The amount of credit to deduct from the user's subscription.
 */
export const updateUsageForUser = async (
  userId: number,
  creditAmount: number
) => {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: userId,
      isActive: true,
    },
    include: {
      subscriptionPackage: true,
    },
  });

  if (subscription?.subscriptionPackage.name.toLowerCase() == "pay as you go") {
    await stripe.subscriptionItems.createUsageRecord(
      String(subscription?.stripeSubscriptionItemId),
      {
        quantity: creditAmount,
        timestamp: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
      }
    );
  } else {
    await prisma.subscription.updateMany({
      where: {
        userId: userId,
        isActive: true,
        subscriptionPackage: {
          NOT: {
            name: "Pay as you go",
          },
        },
      },
      data: {
        creditBalance: {
          decrement: creditAmount,
        },
      }
    });
  }
};

/**
 * Checks if the specified user has enough credit to perform the specified action.
 *
 * @param userId - The ID of the user to check.
 * @param creditAmount - The amount of credit required for the action.
 * @returns `true` if the user has enough credit, or `false` if not.
 */
export const checkCreditsExistForUser = async (
  userId: number,
  creditAmount: number
) => {
  const creditExists = await prisma.subscription.findFirst({
    where: {
      OR: [
        {
          userId: userId,
          isActive: true,
          creditBalance: {
            gte: creditAmount,
          },
        },
        {
          userId: userId,
          isActive: true,
          subscriptionPackage: {
            name: "Pay as you go",
          },
        },
      ],
    },
  });

  return creditExists;
};
