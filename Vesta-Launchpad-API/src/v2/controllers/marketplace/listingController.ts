import { NextFunction, Response } from "express";
import { ListingService } from "@/v2/services/marketplace/listingServices";
import {
  TListingCreateInput,
  TListingFilters,
} from "@/v2/types/marketplace/listing";
import { SUCCESS_RESPONSE } from "@/helpers/responseHelpers";
import { HTTP_STATUS_CODE } from "@/common/constants";

const listingService = new ListingService();

export class ListingController {
  /**
   * Creates a new listing
   * @param req - The request object containing the listing data
   * @param res - The response object
   * @param _next - The next function to handle errors
   */
  async createListing(
    req: any,
    res: Response,
    _next: NextFunction
  ): Promise<any> {
    try {
      const data = req.body;

      // Ensure the data is cast correctly to the expected type
      const listing = await listingService.createListing(
        data as unknown as TListingCreateInput
      );

      // Return a successful response with the created listing
      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        listing,
        "Listed"
      );
    } catch (error) {
      _next(error);
    }
  }

  /**
   * Retrieves listings based on provided filters
   * @param req - The request object containing filters in query params
   * @param res - The response object
   * @param _next - The next function to handle errors
   */
  async getListings(
    req: any,
    res: Response,
    _next: NextFunction
  ): Promise<any> {
    try {
      const filters = {
        maker: req.query.maker as string,
        nftContract: req.query.nftContract as string,
        tokenId: req.query.tokenId as string,
        status: req.query.status as string,
        minPrice: req.query.minPrice as string,
        maxPrice: req.query.maxPrice as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      };

      const listings = await listingService.getListings(
        filters as unknown as TListingFilters
      );

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        listings,
        "Listings fetched successfully"
      );
    } catch (error) {
      _next(error);
    }
  }

  /**
   * Retrieves a specific listing by ID
   * @param req - The request object containing the listing ID in params
   * @param res - The response object
   * @param _next - The next function to handle errors
   */
  async getListing(req: any, res: Response, _next: NextFunction): Promise<any> {
    try {
      const { id } = req.params;

      const listing = await listingService.getListing(id);

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        listing,
        "Listing fetched successfully"
      );
    } catch (error) {
      _next(error);
    }
  }

  /**
   * Retrieves a specific listing by contract address and token id
   * @param req - The request object containing the listing ID in params
   * @param res - The response object
   * @param _next - The next function to handle errors
   */
  async getCurrentActiveListing(
    req: any,
    res: Response,
    _next: NextFunction
  ): Promise<any> {
    try {
      const { contract, tokenId } = req.params;
      console.log({ contract, tokenId });

      const listing = await listingService.getCurrentActiveListing(
        contract,
        tokenId
      );

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        listing,
        "Listing fetched successfully"
      );
    } catch (error) {
      _next(error);
    }
  }

  /**
   * Retrieves get my listings based on provided filters
   * @param req - The request object containing filters in query params
   * @param res - The response object
   * @param _next - The next function to handle errors
   */
  async getMyListings(
    req: any,
    res: Response,
    _next: NextFunction
  ): Promise<any> {
    try {
      const { maker } = req.params;

      const filters = {
        nftContract: req.query.nftContract as string,
        tokenId: req.query.tokenId as string,
        minPrice: req.query.minPrice as string,
        maxPrice: req.query.maxPrice as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      };

      const listings = await listingService.getMyListings(
        maker,
        filters as unknown as TListingFilters
      );

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        listings,
        "My Listings fetched successfully"
      );
    } catch (error) {
      _next(error);
    }
  }

  /**
   * Retrieves get contract listings based on provided filters
   * @param req - The request object containing filters in query params
   * @param res - The response object
   * @param _next - The next function to handle errors
   */
  async getListingsByContract(
    req: any,
    res: Response,
    _next: NextFunction
  ): Promise<any> {
    try {
      const { contract } = req.params;

      const filters = {
        maker: req.query.maker as string,
        tokenId: req.query.tokenId as string,
        minPrice: req.query.minPrice as string,
        maxPrice: req.query.maxPrice as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      };

      const listings = await listingService.getContractListings(
        contract,
        filters as unknown as TListingFilters
      );

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        listings,
        "Contract Listings fetched successfully"
      );
    } catch (error) {
      _next(error);
    }
  }

  /**
   * Updates an existing listing by ID
   * @param req - The request object containing the listing ID in params and data in body
   * @param res - The response object
   * @param _next - The next function to handle errors
   */
  async updateListing(
    req: any,
    res: Response,
    _next: NextFunction
  ): Promise<any> {
    try {
      const { id } = req.params;
      const data = req.body;

      const updatedListing = await listingService.updateListing(id, data);

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        updatedListing,
        "Listing updated successfully"
      );
    } catch (error) {
      _next(error);
    }
  }

  /**
   * Cancels an existing listing by ID
   * @param req - The request object containing the listing ID in params and maker in body
   * @param res - The response object
   * @param _next - The next function to handle errors
   */
  async cancelListing(
    req: any,
    res: Response,
    _next: NextFunction
  ): Promise<any> {
    try {
      const { id } = req.params;
      const { maker } = req.body;

      const cancelledListing = await listingService.cancelListing(id, maker);

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        cancelledListing,
        "Listing cancelled successfully"
      );
    } catch (error) {
      _next(error);
    }
  }

  /**
   * Cancels an existing listing by contract and token id
   * @param req - The request object containing the listing contract and token id in params and maker in body
   * @param res - The response object
   * @param _next - The next function to handle errors
   */
  async cancelListingByTokenID(
    req: any,
    res: Response,
    _next: NextFunction
  ): Promise<any> {
    try {
      const { contract, tokenId } = req.params;
      const { maker } = req.body;
      console.log("maker :", maker);
      const cancelledListing = await listingService.cancelListingByTokenID(
        contract,
        tokenId,
        maker
      );

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        cancelledListing,
        "Listing cancelled successfully"
      );
    } catch (error) {
      _next(error);
    }
  }

  /**
   * update the sold status an existing listing by contract and token id
   * @param req - The request object containing the listing contract and token id in params and maker in body
   * @param res - The response object
   * @param _next - The next function to handle errors
   */
  async updateSold(req: any, res: Response, _next: NextFunction): Promise<any> {
    try {
      const { contract, tokenId } = req.params;
      const { maker } = req.body;
      console.log("maker :", maker);
      const cancelledListing = await listingService.updateSold(
        contract,
        tokenId,
        maker
      );

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        cancelledListing,
        "nft sold successfully"
      );
    } catch (error) {
      _next(error);
    }
  }
}
