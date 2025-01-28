import cron from "node-cron";
import auctionService from "./auctionService";

// Schedule the cron job to run at midnight every day
cron.schedule(
  "0 0 * * *",
  async () => {
    // console.log("Updating auctions at 00:00 at UTC daily");
    await auctionService().updateAllAuctionStatusAndHighestBid();
  },
  {
    scheduled: true,
    timezone: "Etc/UTC",
  }
);
