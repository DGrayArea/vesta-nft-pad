import { NextFunction, Request, Response } from "express";
import {
  TOfferCreateInput,
  TCounterOfferInput,
  TOfferFilters,
} from "@/v2/types/marketplace/offers";
import { offerServices } from "@/v2/services/marketplace/offerServices";
import { SUCCESS_RESPONSE } from "@/helpers/responseHelpers";
import { HTTP_STATUS_CODE } from "@/common/constants";

const offerService = new offerServices();

export class OfferController {
  /**
   * Creates a new offer for an NFT
   * @param req - The request object containing the offer data
   * @param res - The response object
   * @returns The created offer
   */
  async createOffer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const data: TOfferCreateInput = req.body;
      const createdOffer = await offerService.createOffer(data);
      return res.status(201).json({
        message: "Offer created successfully",
        offer: createdOffer,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a counter-offer for an existing offer
   * @param req - The request object containing the offerId and counter-offer data
   * @param res - The response object
   * @returns The created counter-offer
   */
  async createCounterOffer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const offerId = req.params.offerId;
      const data: TCounterOfferInput = req.body;
      const createdCounterOffer = await offerService.createCounterOffer(
        offerId,
        data
      );
      return res.status(201).json({
        message: "Counter offer created successfully",
        counterOffer: createdCounterOffer,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accepts an offer
   * @param req - The request object containing the offerId to accept
   * @param res - The response object
   * @returns The accepted offer
   */
  async acceptOffer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const offerId = req.params.offerId;
      const acceptedOffer = await offerService.acceptOffer(offerId);
      return res.status(200).json({
        message: "Offer accepted successfully",
        offer: acceptedOffer,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancels an offer
   * @param req - The request object containing the offerId to cancel
   * @param res - The response object
   * @returns The cancelled offer
   */
  async cancelOffer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const offerId = req.params.offerId;
      const cancelledOffer = await offerService.cancelOffer(offerId);
      return res.status(200).json({
        message: "Offer cancelled successfully",
        offer: cancelledOffer,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves offers based on provided filters
   * @param req - The request object containing filters in query params
   * @param res - The response object
   * @param next - The next function to handle errors
   */
  async getOffers(req: any, res: Response, next: NextFunction): Promise<any> {
    try {
      const filters = {
        offerId: req.query.offerId as string,
        maker: req.query.maker as string,
        nftContract: req.query.nftContract as string,
        tokenId: req.query.tokenId as string,
        minPrice: req.query.minPrice as string,
        maxPrice: req.query.maxPrice as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      };

      const offers = await offerService.getOffers(
        filters as unknown as TOfferFilters
      );

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        offers,
        "offers fetched successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gets an offer by ID
   * @param req - The request object containing the offerId
   * @param res - The response object
   * @returns The offer details
   */
  async getOffer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const offerId = req.params.offerId;
      const offer = await offerService.getOffer(offerId);

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        offer,
        "Offer retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  }
}
