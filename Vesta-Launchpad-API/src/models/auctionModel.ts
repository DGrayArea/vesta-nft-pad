import { IAuction } from "@/helpers/Interface";
import prisma from "../common/prisma-client";

const auctionModel = () => {
  const createAuction = async (auction: IAuction) => {
    const response = await prisma.auction.create({
      data: {
        startDate: auction.startDate.toUTCString(),
        endDate: auction.endDate.toUTCString(),
        reservePrice: auction.reservePrice,
        status: auction.status,
        tokenId: auction.tokenId,
        contractAddress: auction.contractAddress,
        sellerId: auction.sellerId,
      },
    });

    return response;
  };

  const updateAuction = async (auctionId: number, updateData: object) => {
    const response = await prisma.auction.update({
      where: {
        id: auctionId,
      },
      data: updateData,
    });

    return response;
  };

  const getAllAuctions = async () => {
    const response = await prisma.auction.findMany({
      include: {
        bids: true,
      },
    });

    return response;
  };

  const getAuctionByContractAddressAndTokenId = async (
    contractAddress: string,
    tokenId: number
  ) => {
    const response = await prisma.auction.findFirst({
      where: {
        contractAddress,
        tokenId,
      },
      include: {
        bids: true,
      },
    });

    return response;
  };

  const getAuctionsByBidder = async (bidderId: number) => {
    const response = await prisma.users.findFirst({
      where: {
        id: bidderId,
      },
      include: {
        auctions: true,
      },
    });

    const auctions = response?.auctions ? response.auctions : [];

    return auctions;
  };

  return {
    createAuction,
    updateAuction,
    getAuctionByContractAddressAndTokenId,
    getAuctionsByBidder,
    getAllAuctions,
  };
};

export default auctionModel;
