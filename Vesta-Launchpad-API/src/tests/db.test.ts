import { expect } from "chai";
import auctionModel from "../models/auctionModel";
import { describe } from "mocha";

const dbTest = () => {
  describe("Get all auctions function", () => {
    it("should return all auctions", async () => {
      const auctions = await auctionModel().getAllAuctions();
      const type = typeof auctions;
      console.log("auctions>>> ", auctions);
      //   expect(auctions).to.be.an("array").to.have.length.greaterThan(0);
      expect(type).to.be.equal("array");
    });

    it("should return auctions with bid property", async () => {
      const auctions = await auctionModel().getAllAuctions();
      expect(auctions[0]).to.have.property("bids");
    });
  });

  describe("Get auction by contract address and token id function", async () => {
    it("should return auction by contract address and token id", async () => {
      const contractAddress = "0x123";
      const tokenId = 1;

      const auction =
        await auctionModel().getAuctionByContractAddressAndTokenId(
          contractAddress,
          tokenId
        );

      expect(auction)
        .to.have.property("contractAddress")
        .to.be.equal(contractAddress);
      expect(auction).to.have.property("tokenId").to.be.equal(tokenId);
      expect(auction).to.have.property("bid");
    });
  });
};

dbTest();

export default dbTest;
