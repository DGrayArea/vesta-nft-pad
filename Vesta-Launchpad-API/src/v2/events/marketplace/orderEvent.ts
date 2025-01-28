import prisma from "@/common/prisma-client";
import { marketplace } from "@/v2/utils/web3";
export const orderEvent = () => {
  marketplace.on("OrderExecuted", async (orderHash, _maker, taker, event) => {
    try {
      const order = await prisma.orderV2.findUnique({
        where: { orderHash },
      });

      if (order) {
        await prisma.orderV2.update({
          where: { orderHash },
          data: {
            status: "executed",
            taker,
            transactionHash: event.transactionHash,
          },
        });

        await prisma.listingV2.update({
          where: { id: order.listingId },
          data: { status: "sold" },
        });
      }
    } catch (error) {
      console.error("Failed to process OrderExecuted event:", error);
    }
  });
};
