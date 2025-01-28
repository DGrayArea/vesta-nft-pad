/*
  Warnings:

  - You are about to drop the column `bidId` on the `Auction` table. All the data in the column will be lost.
  - The `status` column on the `Auction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `craetedAt` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `verificationCode` on the `Verification` table. All the data in the column will be lost.
  - You are about to drop the column `verificationCodeTimestamp` on the `Verification` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[contractAddress]` on the table `Auction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[contractAddress,tokenId]` on the table `Auction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectName` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `dateToGetinTouch` on the `Application` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `contractAddress` to the `Auction` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `date` on the `MetaData` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `stripeSubscriptionItemId` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ErrorType" AS ENUM ('TRANSACTION', 'CONNECT_WALLET');

-- CreateEnum
CREATE TYPE "SystemDataType" AS ENUM ('VESTA_FEE');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SystemDocTypes" AS ENUM ('TERMS_CONDTIONS', 'PRIVACY_POLICY', 'LIGHT_PAPER', 'WHITE_PAPER', 'PITCH_DECK', 'ONE_PAGER');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Chains" AS ENUM ('ETHERIUM', 'DOGE', 'SOLANA');

-- CreateEnum
CREATE TYPE "CollectionSaleType" AS ENUM ('PUBLIC', 'PRE', 'PRIVATE');

-- CreateEnum
CREATE TYPE "AuctionStatus" AS ENUM ('FUTURE_AUCTION', 'ACTIVE', 'ENDED');

-- DropForeignKey
ALTER TABLE "Auction" DROP CONSTRAINT "Auction_bidId_fkey";

-- DropForeignKey
ALTER TABLE "Auction" DROP CONSTRAINT "Auction_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "SocialMediaLinks" DROP CONSTRAINT "SocialMediaLinks_applicationId_fkey";

-- DropIndex
DROP INDEX "Document_applicationId_key";

-- DropIndex
DROP INDEX "LinkWallet_userId_key";

-- DropIndex
DROP INDEX "Subscription_userId_key";

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "additionalInfo" TEXT,
ADD COLUMN     "companyAboutUs" TEXT,
ADD COLUMN     "companyBannerURL" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "externalImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "internalImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "kyb_applicant_id" TEXT,
ADD COLUMN     "kyb_verificaion_status" TEXT,
ADD COLUMN     "projectName" TEXT NOT NULL,
ADD COLUMN     "source" TEXT,
DROP COLUMN "dateToGetinTouch",
ADD COLUMN     "dateToGetinTouch" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Auction" DROP COLUMN "bidId",
ADD COLUMN     "contractAddress" TEXT NOT NULL,
ADD COLUMN     "highestBidderUserId" INTEGER,
ADD COLUMN     "usersId" INTEGER,
DROP COLUMN "status",
ADD COLUMN     "status" "AuctionStatus" NOT NULL DEFAULT 'FUTURE_AUCTION';

-- AlterTable
ALTER TABLE "Backers" ADD COLUMN     "telegram" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "website" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Bid" ADD COLUMN     "auctionId" INTEGER;

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "creatorEarning" DOUBLE PRECISION,
ADD COLUMN     "externalUrl" TEXT,
ADD COLUMN     "isPending" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isPromoted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxSupply" INTEGER DEFAULT 0,
ADD COLUMN     "soldCount" INTEGER DEFAULT 0,
ADD COLUMN     "vestaEarning" DOUBLE PRECISION,
ALTER COLUMN "openDate" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "closeDate" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "isApproved" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "collectionId" INTEGER,
ALTER COLUMN "startDate" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "endDate" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "MetaData" DROP COLUMN "date",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "RequestCorrection" ADD COLUMN     "priority" "Priority",
ADD COLUMN     "topic" TEXT,
ADD COLUMN     "userEmail" TEXT;

-- AlterTable
ALTER TABLE "SocialMediaLinks" ADD COLUMN     "usersId" INTEGER,
ADD COLUMN     "website" TEXT,
ALTER COLUMN "applicationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "craetedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "creditBalance" SMALLINT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "stripeSubscriptionItemId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SubscriptionPackage" ADD COLUMN     "stripePriceId" TEXT,
ALTER COLUMN "price" SET DATA TYPE REAL;

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "email" TEXT,
ADD COLUMN     "facebookLink" TEXT,
ADD COLUMN     "instagramLink" TEXT,
ADD COLUMN     "telegram" TEXT,
ALTER COLUMN "linkedinLink" DROP NOT NULL,
ALTER COLUMN "twitterLink" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "kyb_applicant_id" TEXT,
ADD COLUMN     "kyc_applicant_id" TEXT,
ADD COLUMN     "kyc_verificaion_status" TEXT,
ADD COLUMN     "questionnaryResponse" JSONB,
ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "registrationStatus" TEXT DEFAULT 'PENDING',
ADD COLUMN     "stripeId" TEXT,
ADD COLUMN     "twoFactorAuthentication" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Verification" DROP COLUMN "verificationCode",
DROP COLUMN "verificationCodeTimestamp",
ADD COLUMN     "emailVerificationCode" TEXT,
ADD COLUMN     "emailVerificationCodeTimestamp" TIMESTAMP(3),
ADD COLUMN     "gAuthSecretKey" TEXT,
ADD COLUMN     "gAuthSecretKeyTimestamp" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Referrer" (
    "id" SERIAL NOT NULL,
    "referrer" INTEGER,
    "referred" INTEGER,

    CONSTRAINT "Referrer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionSales" (
    "id" SERIAL NOT NULL,
    "saleType" "CollectionSaleType" NOT NULL,
    "maxSupply" DOUBLE PRECISION,
    "maxMintPerTransaction" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "chain" "Chains",
    "numberOfNFTs" INTEGER NOT NULL,
    "minNFTSales" INTEGER NOT NULL,
    "maxNFTSales" INTEGER NOT NULL,
    "whitelist" TEXT,
    "collectionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionSales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "propertyDataLog" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSON,
    "userId" INTEGER,
    "requestParams" JSON,
    "requestPath" TEXT,

    CONSTRAINT "propertyDataLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questionary" (
    "id" SERIAL NOT NULL,
    "questionHeader" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "test" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Questionary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxAuthorities" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "applicationId" INTEGER NOT NULL,

    CONSTRAINT "TaxAuthorities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemDocs" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "type" "SystemDocTypes" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemDocs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemData" (
    "id" SERIAL NOT NULL,
    "vestaEarning" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "SystemDataType" NOT NULL,

    CONSTRAINT "SystemData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorLogs" (
    "id" TEXT NOT NULL,
    "url" TEXT,
    "host" TEXT,
    "origin" TEXT,
    "userAgent" TEXT,
    "method" TEXT NOT NULL,
    "body" TEXT,
    "userId" INTEGER,
    "type" "ErrorType",
    "statusCode" INTEGER,
    "errorMessage" TEXT,
    "timestamp" TIMESTAMP(3),

    CONSTRAINT "ErrorLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingV2" (
    "id" TEXT NOT NULL,
    "nftContract" TEXT NOT NULL,
    "orderHash" TEXT,
    "tokenId" INTEGER NOT NULL,
    "nonce" TEXT,
    "maker" TEXT NOT NULL,
    "taker" TEXT,
    "expiry" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" TEXT NOT NULL,
    "paymentToken" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "params" TEXT,
    "signature" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "ListingV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderV2" (
    "id" TEXT NOT NULL,
    "orderHash" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "maker" TEXT NOT NULL,
    "taker" TEXT,
    "expiry" TIMESTAMP(3) NOT NULL,
    "nonce" INTEGER NOT NULL,
    "signature" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "transactionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionV2" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "seller" TEXT NOT NULL,
    "highestBidder" TEXT,
    "highestBid" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "minBidIncrement" TEXT NOT NULL,
    "reservePrice" TEXT NOT NULL,
    "settled" BOOLEAN NOT NULL DEFAULT false,
    "paymentToken" TEXT NOT NULL,
    "nftContract" TEXT NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuctionV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferV2" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "offerer" TEXT NOT NULL,
    "nftContract" TEXT NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" TEXT NOT NULL,
    "paymentToken" TEXT NOT NULL,
    "expiry" TIMESTAMP(3) NOT NULL,
    "nonce" INTEGER NOT NULL,
    "isCounterOffer" BOOLEAN NOT NULL DEFAULT false,
    "originalOfferId" TEXT,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NonceTracking" (
    "id" SERIAL NOT NULL,
    "makerAddress" VARCHAR(42) NOT NULL,
    "nonce" BIGINT NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listingId" VARCHAR(66),

    CONSTRAINT "NonceTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Referrer_referred_key" ON "Referrer"("referred");

-- CreateIndex
CREATE UNIQUE INDEX "ListingV2_orderHash_key" ON "ListingV2"("orderHash");

-- CreateIndex
CREATE UNIQUE INDEX "OrderV2_orderHash_key" ON "OrderV2"("orderHash");

-- CreateIndex
CREATE UNIQUE INDEX "AuctionV2_auctionId_key" ON "AuctionV2"("auctionId");

-- CreateIndex
CREATE UNIQUE INDEX "OfferV2_offerId_key" ON "OfferV2"("offerId");

-- CreateIndex
CREATE INDEX "NonceTracking_makerAddress_status_idx" ON "NonceTracking"("makerAddress", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NonceTracking_makerAddress_nonce_key" ON "NonceTracking"("makerAddress", "nonce");

-- CreateIndex
CREATE UNIQUE INDEX "Auction_contractAddress_key" ON "Auction"("contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Auction_contractAddress_tokenId_key" ON "Auction"("contractAddress", "tokenId");

-- AddForeignKey
ALTER TABLE "Referrer" ADD CONSTRAINT "Referrer_referred_fkey" FOREIGN KEY ("referred") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referrer" ADD CONSTRAINT "Referrer_referrer_fkey" FOREIGN KEY ("referrer") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMediaLinks" ADD CONSTRAINT "SocialMediaLinks_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMediaLinks" ADD CONSTRAINT "SocialMediaLinks_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionSales" ADD CONSTRAINT "CollectionSales_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propertyDataLog" ADD CONSTRAINT "public_propertyDataLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TaxAuthorities" ADD CONSTRAINT "TaxAuthorities_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorLogs" ADD CONSTRAINT "ErrorLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderV2" ADD CONSTRAINT "OrderV2_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "ListingV2"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
