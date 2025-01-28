import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS_CODE } from "@/common/constants";
import { SUCCESS_RESPONSE } from "@/helpers/responseHelpers";
import { OrderService } from "@/v2/services/marketplace/orderServices";
import { TOrderFilters } from "@/v2/types/marketplace/order";

const orderService = new OrderService();

export class OrderController {
  /**
   * Creates a new order for a listing.
   * @param req - The request object containing listing details in the body.
   * @param res - The response object.
   * @param next - The next middleware function to handle errors.
   */

  async createOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { listing, signer } = req.body;

      // Create the order using the service
      const createdOrder = await orderService.createOrder(listing, signer);

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        createdOrder,
        "Order created successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Executes an existing order.
   * @param req - The request object containing the order details and signature.
   * @param res - The response object.
   * @param next - The next middleware function to handle errors.
   */

  async executeOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { order, signature } = req.body;

      // Execute the order using the service
      const receipt = await orderService.executeOrder(order, signature);

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        receipt,
        "Order executed successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves an order by its hash.
   * @param req - The request object containing the orderHash in the params.
   * @param res - The response object.
   * @param next - The next middleware function to handle errors.
   */

  async getOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { orderHash } = req.params;

      // Retrieve the order using the service
      const order = await orderService.getOrder(orderHash);

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        order,
        "Order retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves orders based on provided filters with pagination.
   * @param req - The request object containing filters in the query.
   * @param res - The response object.
   * @param next - The next middleware function to handle errors.
   */

  async getOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const filters = req.query as unknown as TOrderFilters;

      // Retrieve the paginated list of orders using the service
      const orders = await orderService.getOrders(filters);

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        orders,
        "Orders retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancels an order if it hasn't been executed yet.
   * @param req - The request object containing orderHash and maker details.
   * @param res - The response object.
   * @param next - The next middleware function to handle errors.
   */
  
  async cancelOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { orderHash } = req.params;
      const { maker } = req.body;

      // Cancel the order using the service
      const cancelledOrder = await orderService.cancelOrder(orderHash, maker);

      return SUCCESS_RESPONSE(
        res,
        true,
        HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE,
        cancelledOrder,
        "Order cancelled successfully"
      );
    } catch (error) {
      next(error);
    }
  }
}
