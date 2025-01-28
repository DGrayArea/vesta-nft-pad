import { NextFunction, Request, Response } from "express";
import { SUCCESS_RESPONSE } from "@/helpers/responseHelpers";
import { HTTP_STATUS_CODE } from "@/common/constants";
import { NftService } from "@/v2/services/marketplace/nftServices";
import { NotFoundError } from "@/v2/helper/api-errors";

const nftService = new NftService();

export class NftController {
  /**
   * Gets NFTs for a collection by contract address with optional filters
   * @param req - The request object containing contract address in params and filters in query
   * @param res - The response object
   * @param _next - The next function to handle errors
   */
  async getNFTsByCollection(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<any> {
    try {
      const { contract } = req.params;

      const filters = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      };

      const nftData = await nftService.getNFTsByCollection(contract, filters);

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        nftData,
        "NFTs retrieved successfully"
      );
    } catch (error) {
      _next(error);
    }
  }

  /**
   * Gets NFT details by token ID and contract address
   * @param req - The request object containing contract and tokenId in params
   * @param res - The response object
   * @param _next - The next function to handle errors
   */
  async getNftByTokenId(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<any> {
    try {
      const { contract, tokenId } = req.params;

      const nftData = await nftService.getNftByTokenId(
        contract,
        Number(tokenId)
      );

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        nftData,
        "NFT retrieved successfully"
      );
    } catch (error) {
      _next(error);
    }
  }

  /**
   * Retrieves NFTs owned by a specific account with listing status and pagination
   * @param req - The request object containing account address in params and filters in query
   * @param res - The response object
   * @param _next - The next function to handle errors
   */
  async getMyOwnedNfts(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<any> {
    try {
      const { address } = req.params;

      if (!address) {
        throw new NotFoundError("Address not found ");
      }

      console.log("xxxxxxx :", address);

      const filters = {
        status: req.query.status || "all", // Filter by listing status (listed, unlisted, all)
        page: Number(req.query.page) || 1, // Default page to 1
        limit: Number(req.query.limit) || 10, // Default limit to 10
      };

      const nftData = await nftService.getMyNfts(address, filters);

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        nftData,
        "NFTs retrieved successfully"
      );
    } catch (error) {
      _next(error);
    }
  }

  /**
   * Retrieves all listed NFTs with optional pagination filters.
   * @param req - The request object containing pagination filters in query.
   * @param res - The response object to send the result.
   * @param _next - The next function to handle errors.
   */
  async getAllListedNfts(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<any> {
    try {
      const filters = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      };

      const nftData = await nftService.getAllListedNfts(filters);

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        nftData,
        "NFTs retrieved successfully"
      );
    } catch (error) {
      _next(error);
    }
  }
}
