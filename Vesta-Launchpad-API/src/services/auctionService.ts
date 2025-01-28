import auctionModel from "@/models/auctionModel";
import { Auction, AuctionStatus, Bid } from "@prisma/client";

const auctionService = () => {
  const validateBid = async (
    tokenId: number,
    contractAddress: string,
    bidAmount: number
  ) => {
    const auction = await auctionModel().getAuctionByContractAddressAndTokenId(
      contractAddress,
      tokenId
    );

    if (!auction) {
      throw new Error("Auction not found");
    }

    if (auction.startDate > new Date()) {
      throw new Error("Auction not started yet");
    }

    if (auction.endDate < new Date()) {
      throw new Error("Auction ended");
    }

    if (auction.reservePrice > bidAmount) {
      throw new Error("Bid amount less than reserve price");
    }

    if (auction.bids.length > 0) {
      const highestBid = findHighestBid(auction);

      if (highestBid.amount >= bidAmount) {
        throw new Error("Bid amount less than highest bid");
      }
    }

    return { isValidated: true, auction };
  };

  const getAuctionsByBidder = async (bidderId: number) => {
    let wonAuctions: Auction[] = [],
      participatedAuctions: Auction[] = [];

    const auctions = await auctionModel().getAuctionsByBidder(bidderId);

    if (auctions.length === 0) {
      return auctions;
    }

    for (const auction of auctions) {
      const highestBidderId = auction?.highestBidderUserId;

      if (highestBidderId === bidderId) {
        wonAuctions.push(auction);
      } else {
        participatedAuctions.push(auction);
      }
    }

    return { wonAuctions, participatedAuctions };
  };

  const getAllAuctions = async () => {
    const auctions = await auctionModel().getAllAuctions();

    return auctions;
  };

  const findHighestBid = (auction: any) => {
    const highestBid = auction.bids.reduce((prev: Bid, current: Bid) => {
      return prev.amount > current.amount ? prev : current;
    });

    return highestBid;
  };

  const updateAllAuctionStatusAndHighestBid = async () => {
    const auctions = await getAllAuctions();
    const currentTime = new Date();

    for (const auction of auctions) {
      const endDate = new Date(auction.endDate);
      const startDate = new Date(auction.startDate);
      const highestBid = findHighestBid(auction);

      // In ts/js, date comparisons always happens in UTC regardless of the timezone of the date objects. Here, we get auction.endDate in utc string. Cuz that's how we save it in the db.
      if (endDate < currentTime) {
        const updateData = {
          status: AuctionStatus.ENDED,
          highestBidderUserId: highestBid.bidderId,
        };

        await auctionModel().updateAuction(auction.id, updateData);
      }

      if (startDate < currentTime && endDate > currentTime) {
        const updateData = {
          status: AuctionStatus.ACTIVE,
        };

        await auctionModel().updateAuction(auction.id, updateData);
      }
    }
  };

  return {
    validateBid,
    getAuctionsByBidder,
    getAllAuctions,
    updateAllAuctionStatusAndHighestBid,
  };
};

export default auctionService;
