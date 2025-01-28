import { NextFunction, Response } from "express";
import { SUCCESS_RESPONSE } from "@/helpers/responseHelpers";
import { HTTP_STATUS_CODE } from "@/common/constants";
import { AuctionService } from "@/v2/services/marketplace/autionServices";

const auctionService = new AuctionService();

export class AuctionController {
  /**
   * Creates a new auction.
   * @param req - The HTTP request object.
   * @param res - The HTTP response object.
   */
  async createAuction(
    req: any,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const data = req.body;

      // Ensure the data is cast correctly to the expected type
      const auction = await auctionService.createAuction(data);

      // Return a successful response with the created auction
      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        auction,
        "Auction created successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a list of auctions based on filters.
   * @param req - The HTTP request object.
   * @param res - The HTTP response object.
   */
  async getAuctions(req: any, res: Response, next: NextFunction): Promise<any> {
    try {
      const filters = {
        maker: req.query.maker as string,
        nftContract: req.query.nftContract as string,
        status: req.query.status as string,
        strategyId: req.query.strategyId as string,
        minPrice: req.query.minPrice as string,
        maxPrice: req.query.maxPrice as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      };

      const { auctions, pagination } = await auctionService.getAuctions(
        filters
      );

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        { auctions, pagination },
        "Auctions fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a specific auction by ID.
   * @param req - The request object containing the auction ID in params.
   * @param res - The response object.
   * @param next - The next function to handle errors.
   */
  async getAuction(req: any, res: Response, next: NextFunction): Promise<any> {
    try {
      const { id } = req.params;

      const auction = await auctionService.getAuction(id);

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        auction,
        "Auction fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Places a bid on an auction.
   * @param req - The request object containing the auction ID in params and bid data in body.
   * @param res - The response object.
   * @param next - The next function to handle errors.
   */
  async placeBid(req: any, res: Response, next: NextFunction): Promise<any> {
    try {
      const { id } = req.params;
      const data = req.body;

      const updatedAuction = await auctionService.placeBid(id, data);

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        updatedAuction,
        "Bid placed successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Settles an auction once it's ended.
   * @param req - The request object containing the auction ID in params and seller data in body.
   * @param res - The response object.
   * @param next - The next function to handle errors.
   */
  async settleAuction(
    req: any,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { id } = req.params;
      const { seller } = req.body;

      const settledAuction = await auctionService.settleAuction(id, seller);

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        settledAuction,
        "Auction settled successfully"
      );
    } catch (error) {
      next(error);
    }
  }
}
