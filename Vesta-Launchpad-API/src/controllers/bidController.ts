import { NextFunction, Response } from "express";
import {
  HTTP_STATUS_CODE,
  REQUEST_METHOD,
  TRANSACTION_METHODS,
  VALIDATION_MESSAGES,
} from "../common/constants";
import prisma from "../common/prisma-client";
import { IBidRequest } from "../helpers/Interface";
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "../helpers/responseHelpers";
import {
  getBidAcceptEventLogs,
  getBidPlacedEventLogs,
  getBidWithdrawEventLogs,
} from "../helpers/eventLogs";
import { logger } from "../helpers/loggers";
import { sendMessageToUser } from "../helpers/utils";
import { cloudlog } from "../helpers/cloudwatchLogger";
import { AuctionStatus } from "@prisma/client";

export const getAllBidsByNFT = async (
  req: IBidRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }
    const { contractAddress, tokenId } = req.params;

    const collection = await prisma.collection.findUnique({
      where: { contractAddress },
    });

    if (!collection) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_COLLECTION
      );
    }

    const bids = await prisma.bid.findMany({
      where: { contractAddress, tokenId: parseInt(tokenId), isBid: true },
      orderBy: { createdAt: "desc" },
      include: {
        listing: true,
        bidder: {
          select: {
            email: true,
            fname: true,
            lname: true,
            profileImage: true,
          },
        },
      },
    });

    if (!bids || bids.length <= 0) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.NOT_FOUND_RESPONSE_CODE,
        VALIDATION_MESSAGES.BID_NOT_FOUND
      );
    }

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      bids,
      VALIDATION_MESSAGES.BID_RETRIEVED
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
 * This function handles the API call for find bid data by specific id
 *
 * @param {IListingRequest} req - req listing id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const getBidByID = async (
  req: IBidRequest,
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
    const bidID = parseInt(id);

    const bid = await prisma.bid.findUnique({
      where: {
        id: bidID,
      },
    });

    if (!bid) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        VALIDATION_MESSAGES.INVALID_BID
      );
    }
    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      bid,
      VALIDATION_MESSAGES.BID_RETRIEVED
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
 * This function handles the API call for find bid data by specific id
 *
 * @param {IListingRequest} req - req listing id
 * @param {express} res - express response
 * @return {express response<{status:string,data:{}, message: string}>}
 */

export const bidPlaced = async (
  req: IBidRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }
    const { txHash } = req.params;
    cloudlog.info(`Refreshing Bid ${txHash}`);
    const eventLogs = await getBidPlacedEventLogs(txHash);
    if (!eventLogs) {
      cloudlog.error("something went wrong with place eventLogs");
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "something went wrong with place eventLogs"
      );
    }

    //the transaction
    await prisma.transaction.create({
      data: {
        blockHash: eventLogs[0].blockHash,
        blockNumber: eventLogs[0].blockNumber,
        contractAddress: eventLogs[0].contractAddress,
        method: TRANSACTION_METHODS.BID_PLACED,
        from: eventLogs[0].from,
        to: eventLogs[0].to,
        tokenId: eventLogs[0].tokenId,
        txHash: eventLogs[0].transactionHash,
        cumulativeGasUsed: eventLogs[0].cumulativeGasUsed,
        gasPrice: eventLogs[0].gasPrice,
        gasUsed: eventLogs[0].gasUsed,
        price: eventLogs[0].price,
        txnFee: eventLogs[0].txnFee,
      },
    });

    const existingListing: any = await prisma.listing.findFirst({
      where: {
        tokenId: eventLogs[0].tokenId,
        contractAddress: eventLogs[0].contractAddress,
        isListed: true,
      },
    });

    const existingBid: any = await prisma.bid.findFirst({
      where: {
        tokenId: eventLogs[0].tokenId,
        contractAddress: eventLogs[0].contractAddress,
        bidderAddress: eventLogs[0].bidder,
        isBid: true,
      },
    });

    const existingAuction = await prisma.auction.findFirst({
      where: {
        tokenId: eventLogs[0].tokenId,
        contractAddress: eventLogs[0].contractAddress,
      },
    });

    if (existingBid?.isBidPlaceEventHappend) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "Bid already placed in event listener"
      );
    }

    if (existingBid) {
      sendMessageToUser(
        eventLogs[0].bidder,
        "Bid",
        null,
        "Already bid on this nft",
        false
      );
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "Already bid on this nft"
      );
    }

    if (!existingAuction) {
      const placeBid = await prisma.bid.create({
        data: {
          amount: eventLogs[0].price,
          listingId: existingListing?.id,
          bidderAddress: eventLogs[0].bidder,
          bidStatus: "PLACED",
          isBid: true,
          isBidAccepted: false,
          isBidPlaceEventHappend: true,
          contractAddress: eventLogs[0].contractAddress,
          tokenId: eventLogs[0].tokenId,
        },
      });

      sendMessageToUser(
        eventLogs[0].bidder,
        "Bid",
        placeBid,
        "Successfully placed bid",
        true
      );

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        placeBid,
        VALIDATION_MESSAGES.BID_PLACED_SUCCESS
      );
    }

    if (existingAuction) {
      const placeBid = await prisma.bid.create({
        data: {
          amount: eventLogs[0].price,
          listingId: existingListing?.id,
          bidderAddress: eventLogs[0].bidder,
          bidStatus: "PLACED",
          isBid: true,
          isBidAccepted: false,
          isBidPlaceEventHappend: true,
          contractAddress: eventLogs[0].contractAddress,
          tokenId: eventLogs[0].tokenId,
          auctionId: existingAuction?.id,
        },
      });

      await prisma.auction.update({
        where: { id: existingAuction.id },
        data: {
          status: AuctionStatus.ACTIVE,
          bids: { connect: { id: placeBid.id } },
          usersId: eventLogs[0].bidder,
        },
      });

      await prisma.users.update({
        where: { id: eventLogs[0].bidder },
        data: {
          auctions: { connect: { id: existingAuction.id } },
        },
      });

      sendMessageToUser(
        eventLogs[0].bidder,
        "Bid",
        placeBid,
        "Successfully placed auction bid",
        true
      );

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        placeBid,
        VALIDATION_MESSAGES.BID_PLACED_SUCCESS
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

export const bidAccept = async (
  req: IBidRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }
    const { txHash } = req.params;

    const eventLogs = await getBidAcceptEventLogs(txHash);

    if (!eventLogs) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        " something went wrong with accept eventLogs"
      );
    }

    //the transaction
    await prisma.transaction.create({
      data: {
        blockHash: eventLogs[0].blockHash,
        blockNumber: eventLogs[0].blockNumber,
        contractAddress: eventLogs[0].contractAddress,
        method: TRANSACTION_METHODS.BID_ACCEPTED,
        from: eventLogs[0].from,
        to: eventLogs[0].to,
        tokenId: eventLogs[0].tokenId,
        txHash: eventLogs[0].transactionHash,
        cumulativeGasUsed: eventLogs[0].cumulativeGasUsed,
        gasPrice: eventLogs[0].gasPrice,
        gasUsed: eventLogs[0].gasUsed,
        price: eventLogs[0].price,
        txnFee: eventLogs[0].txnFee,
      },
    });

    const existingListing: any = await prisma.listing.findFirst({
      where: {
        tokenId: eventLogs[0].tokenId,
        contractAddress: eventLogs[0].contractAddress,
        isListed: true,
      },
    });

    const existingBid: any = await prisma.bid.findFirst({
      where: {
        tokenId: eventLogs[0].tokenId,
        contractAddress: eventLogs[0].contractAddress,
        bidderAddress: eventLogs[0].bidder,
        isBid: true,
      },
    });

    if (!existingBid) {
      sendMessageToUser(
        eventLogs[0].bidder,
        "Bid",
        null,
        "Invalid bid, something went wrong with accept",
        false
      );

      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "Invalid bid, something went wrong with accept"
      );
    }

    if (existingBid?.isBidAcceptEventHappend) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "Bid already accept in event listener"
      );
    }

    const acceptBid = await prisma.bid.update({
      where: { id: existingBid?.id },
      data: {
        amount: eventLogs[0].price,
        bidderAddress: eventLogs[0].bidder,
        listingId: existingListing?.id,
        bidStatus: "ACCEPTED",
        isBid: false,
        isBidAccepted: true,
        isBidAcceptEventHappend: true,
        contractAddress: eventLogs[0].contractAddress,
        tokenId: eventLogs[0].tokenId,
      },
    });

    const listing = await prisma.listing.update({
      where: { id: existingListing?.id },
      data: { isListed: false, isSold: true, ownerOf: eventLogs[0].bidder },
    });

    sendMessageToUser(
      eventLogs[0].bidder,
      "Bid",
      { acceptBid, listing },
      "Bid Accepted Successfully",
      true
    );

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      { acceptBid, listing },
      VALIDATION_MESSAGES.BID_ACCEPT
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

export const bidWithdraw = async (
  req: IBidRequest,
  res: Response,
  _: NextFunction
) => {
  try {
    if (req.method !== REQUEST_METHOD.GET) {
      throw new Error(
        `Invalid Method Type, Only ${REQUEST_METHOD.GET} Allowed`
      );
    }
    const { txHash } = req.params;

    const eventLogs = await getBidWithdrawEventLogs(txHash);

    if (!eventLogs) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "something went wrong with withdraw eventLogs"
      );
    }

    await prisma.transaction.create({
      data: {
        blockHash: eventLogs[0].blockHash,
        blockNumber: eventLogs[0].blockNumber,
        contractAddress: eventLogs[0].contractAddress,
        method: TRANSACTION_METHODS.BID_WITHDRAW,
        from: eventLogs[0].from,
        to: eventLogs[0].to,
        tokenId: eventLogs[0].tokenId,
        txHash: eventLogs[0].transactionHash,
        cumulativeGasUsed: eventLogs[0].cumulativeGasUsed,
        gasPrice: eventLogs[0].gasPrice,
        gasUsed: eventLogs[0].gasUsed,
        price: eventLogs[0].price,
        txnFee: eventLogs[0].txnFee,
      },
    });

    const existingListing: any = await prisma.listing.findFirst({
      where: {
        tokenId: eventLogs[0].tokenId,
        contractAddress: eventLogs[0].contractAddress,
        isListed: true,
      },
    });

    const existingBid: any = await prisma.bid.findFirst({
      where: {
        tokenId: eventLogs[0].tokenId,
        contractAddress: eventLogs[0].contractAddress,
        bidderAddress: eventLogs[0].bidder,
        isBid: true,
      },
    });

    if (!existingBid) {
      sendMessageToUser(
        eventLogs[0].bidder,
        "Bid",
        null,
        "Invalid Bid, something went wrong with withdraw",
        false
      );

      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "Invalid Bid, something went wrong with withdraw"
      );
    }

    if (existingBid?.isBidWithdrawEventHappend) {
      return ERROR_RESPONSE(
        res,
        false,
        HTTP_STATUS_CODE.BAD_REQUEST_RESPONSE_CODE,
        "Bid already withdraw in event listener"
      );
    }

    const withdrawBid = await prisma.bid.update({
      where: { id: existingBid?.id },
      data: {
        amount: eventLogs[0].price,
        bidderAddress: eventLogs[0].bidder,
        listingId: existingListing?.id,
        bidStatus: "WITHDRAWN",
        isBid: false,
        isBidAccepted: false,
        isBidWithdrawEventHappend: true,
        contractAddress: eventLogs[0].contractAddress,
        tokenId: eventLogs[0].tokenId,
      },
    });

    sendMessageToUser(
      eventLogs[0].bidder,
      "Bid",
      withdrawBid,
      "Bid Withdraw Successfully",
      true
    );

    return SUCCESS_RESPONSE(
      res,
      true,
      HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
      withdrawBid,
      VALIDATION_MESSAGES.BID_WITHDRAW
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
