import prisma from "@/common/prisma-client";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/v2/helper/api-errors";
import { TListing } from "@/v2/types/marketplace/listing";
import {
  TOrder,
  TOrderFilters,
  TPaginatedResponse,
} from "@/v2/types/marketplace/order";
import { marketplace } from "@/v2/utils/web3";
import { ethers } from "ethers";

export class OrderService {
  /**
   * Creates a new order based on the provided listing and signer.
   * @param listing - The listing data for the order creation.
   * @param signer - The signer used to sign the order.
   * @returns The created order.
   * @throws MarketplaceError if the listing is not found or creation fails.
   */

  async createOrder(listing: TListing, signer: ethers.Signer): Promise<any> {
    // Validate if the listing exists (optional step based on your needs)
    const existingListing = await prisma.listingV2.findUnique({
      where: { id: listing.id },
    });

    if (!existingListing) {
      throw new NotFoundError(
        `Listing not found :No listing found for ID: ${listing.id}`
      );
    }
    const order = {
      maker: listing.maker,
      taker: ethers.ZeroAddress, // Open order
      expiry: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      nonce: await marketplace.getNonce(listing.maker),
      nftContract: listing.nftContract,
      tokenId: listing.tokenId,
      quantity: listing.quantity,
      price: listing.price,
      paymentToken: listing.paymentToken,
      strategyId: listing.strategyId,
      params: listing.params,
    };

    const orderHash = await marketplace.getOrderHash(order);
    const signature = await signer.signMessage(ethers.getBytes(orderHash));

    const createOrder = await prisma.orderV2.create({
      data: {
        orderHash: orderHash,
        maker: order.maker,
        taker: order.taker,
        expiry: new Date(order.expiry),
        nonce: order.nonce,
        signature: signature,
        status: "pending",
        listing: {
          connect: {
            id: listing.id,
          },
        },
      },
    });

    return createOrder;
  }

  /**
   * Executes an existing order by validating the order and its signature.
   * @param order - The order to be executed.
   * @param signature - The signature used to confirm the order.
   * @returns The transaction receipt from executing the order.
   * @throws MarketplaceError if the order is not found or execution fails.
   */

  async executeOrder(order: TOrder, signature: string): Promise<any> {
    // Validate order exists before execution
    const existingOrder = await prisma.orderV2.findUnique({
      where: { orderHash: order.orderHash },
    });

    if (!existingOrder) {
      throw new NotFoundError(
        `Order not found : Order with hash ${order.orderHash} not found.`
      );
    }
    // Check if order is expired
    if (existingOrder.expiry < new Date()) {
      throw new NotFoundError(
        `Order expired: This order has expired and cannot be executed`
      );
    }

    // Check if order is already executed
    if (existingOrder.status === "executed") {
      throw new NotFoundError(
        `Order already executed:This order has already been executed`
      );
    }

    // Execute the order on the marketplace
    const tx = await marketplace.executeOrder(order, signature);
    const receipt = await tx.wait();

    // Update the order status to 'executed' in the database
    await prisma.orderV2.update({
      where: { orderHash: order.orderHash },
      data: {
        status: "executed",
        transactionHash: receipt.transactionHash,
      },
    });

    return receipt;
  }

  /**
   * Retrieves an order by its hash.
   * @param orderHash - The hash of the order to retrieve.
   * @returns The order details.
   * @throws MarketplaceError if the order is not found.
   */

  async getOrder(orderHash: string): Promise<any> {
    const order = await prisma.orderV2.findUnique({
      where: { orderHash },
      include: {
        listing: true,
      },
    });

    if (!order) {
      throw new NotFoundError(
        `Order not found", 404: No order found for hash: ${orderHash}`
      );
    }

    return order;
  }

  /**
   * Retrieves orders based on provided filters with pagination.
   * @param filters - The filters to apply to the order query.
   * @returns Paginated list of orders matching the filters.
   */

  async getOrders(filters: TOrderFilters): Promise<TPaginatedResponse<any>> {
    const { maker, taker, status, page = 1, limit = 10 } = filters;

    const where: any = {};
    if (maker) where.maker = maker;
    if (taker) where.taker = taker;
    if (status) where.status = status;
    const [orders, total] = await prisma.$transaction([
      prisma.orderV2.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          listing: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.orderV2.count({ where }),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
    };
  }

  /**
   * Cancels an order if it hasn't been executed yet.
   * @param orderHash - The hash of the order to cancel.
   * @param maker - The address of the order maker (for authorization).
   * @returns The cancelled order.
   * @throws MarketplaceError if the order is not found or cannot be cancelled.
   */
  async cancelOrder(orderHash: string, maker: string): Promise<any> {
    const order = await this.getOrder(orderHash);

    if (order.maker !== maker) {
      throw new ForbiddenError(
        `Unauthorized :Only the order maker can cancel this order`
      );
    }

    if (order.status !== "pending") {
      throw new BadRequestError(
        "Invalid order status:Only pending orders can be cancelled"
      );
    }

    // Cancel the order on the blockchain
    const tx = await marketplace.cancelOrder(order);
    await tx.wait();

    // Update the order status in the database
    return await prisma.orderV2.update({
      where: { orderHash },
      data: { status: "cancelled" },
      include: {
        listing: true,
      },
    });
  }
}
