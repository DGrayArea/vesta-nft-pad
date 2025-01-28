-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "uid" TEXT,
    "fname" TEXT,
    "lname" TEXT,
    "email" TEXT,
    "birthDate" TIMESTAMP(3),
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "provider" TEXT,
    "service" TEXT,
    "employmentStatus" TEXT,
    "sourceOfFunds" TEXT,
    "profileImage" TEXT,
    "isPublish" BOOLEAN NOT NULL DEFAULT true,
    "password" TEXT,
    "role" TEXT DEFAULT 'USER',
    "status" TEXT DEFAULT 'APPROVED',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isTwoStepVerification" BOOLEAN NOT NULL DEFAULT false,
    "phoneNumber" INTEGER,
    "verificationCode" TEXT,
    "verificationCodeTimestamp" TIMESTAMP(3),

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" SERIAL NOT NULL,
    "privacyStatement" BOOLEAN DEFAULT false,
    "termsAndConditions" BOOLEAN DEFAULT false,
    "accountVisibility" BOOLEAN DEFAULT false,
    "updates" BOOLEAN NOT NULL DEFAULT false,
    "maintenance" BOOLEAN NOT NULL DEFAULT false,
    "marketing" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkWallet" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "provider" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "signature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "LinkWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KYCVerification" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "KYCVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "goalDescription" TEXT NOT NULL,
    "projectDescription" TEXT NOT NULL,
    "dateToGetinTouch" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hasBacker" BOOLEAN,
    "roadMap" JSONB,
    "roadMapImageURL" TEXT,
    "usersId" INTEGER,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backers" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "ticketSize" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "goalDescription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "applicationId" INTEGER,

    CONSTRAINT "Backers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "titleDeed" TEXT,
    "projectDescription" TEXT,
    "businessPlan" TEXT,
    "technicalSpecification" TEXT,
    "designPlan" TEXT,
    "applicationId" INTEGER NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMediaLinks" (
    "id" SERIAL NOT NULL,
    "twitter" TEXT,
    "linkedIn" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "youtube" TEXT,
    "discord" TEXT,
    "telegram" TEXT,
    "applicationId" INTEGER NOT NULL,

    CONSTRAINT "SocialMediaLinks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "applicationId" INTEGER,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" SERIAL NOT NULL,
    "profileImage" TEXT,
    "fullName" TEXT,
    "position" TEXT,
    "contribution" TEXT,
    "linkedinLink" TEXT NOT NULL,
    "twitterLink" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "applicationId" INTEGER NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPackage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "creditAmount" INTEGER NOT NULL,
    "craetedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" INTEGER NOT NULL,

    CONSTRAINT "SubscriptionPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "subscriptionPackageId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "activationDate" TIMESTAMP(3) NOT NULL,
    "craetedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionQueue" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "requestedPackageId" INTEGER NOT NULL,
    "requestedActivationDate" TIMESTAMP(3) NOT NULL,
    "craetedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" SERIAL NOT NULL,
    "collectionUUID" TEXT,
    "colname_idx" TEXT NOT NULL,
    "symbol" TEXT,
    "slug" TEXT,
    "description" TEXT NOT NULL,
    "logoImage" TEXT NOT NULL,
    "featuredImage" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "contractAddress" TEXT,
    "bannerImage" TEXT NOT NULL,
    "price" DOUBLE PRECISION DEFAULT 0,
    "floorPrice" DOUBLE PRECISION DEFAULT 0,
    "totalVolume" DOUBLE PRECISION DEFAULT 0,
    "baseURL" TEXT,
    "isDeploy" BOOLEAN NOT NULL DEFAULT false,
    "openDate" TIMESTAMP(3),
    "closeDate" TIMESTAMP(3),
    "saleType" TEXT,
    "chain" TEXT,
    "totalNft" INTEGER,
    "minPerWalletLimit" INTEGER DEFAULT 0,
    "maPerxWalletLimit" INTEGER DEFAULT 0,
    "isDeployEventHappend" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "isPublish" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "applicationId" INTEGER,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "featuredimage" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "isPublish" BOOLEAN NOT NULL DEFAULT false,
    "postType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" INTEGER NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NFT" (
    "id" SERIAL NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "name_idx" TEXT,
    "tokenimageURL" TEXT,
    "address" TEXT,
    "description" TEXT,
    "attributes" JSONB,
    "ownerOfId" INTEGER NOT NULL,
    "isPublish" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" INTEGER NOT NULL,

    CONSTRAINT "NFT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NFTLikes" (
    "id" SERIAL NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NFTLikes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaData" (
    "id" SERIAL NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "slug" TEXT,
    "name" TEXT,
    "description" TEXT,
    "image" TEXT,
    "imageHash" TEXT,
    "edition" INTEGER,
    "date" INTEGER NOT NULL,
    "attributes" JSONB,
    "isPublish" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "collectionId" INTEGER NOT NULL,
    "creatorId" INTEGER NOT NULL,

    CONSTRAINT "MetaData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" SERIAL NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "tokenId" INTEGER NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "ownerOf" TEXT,
    "signature" TEXT NOT NULL,
    "nounce" TEXT,
    "isListed" BOOLEAN NOT NULL DEFAULT false,
    "isSold" BOOLEAN NOT NULL DEFAULT false,
    "isPurchaseEventHappend" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sellerId" INTEGER NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auction" (
    "id" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reservePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "bidId" INTEGER,

    CONSTRAINT "Auction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER,
    "bidderId" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bidderAddress" TEXT,
    "contractAddress" TEXT NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "bidDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "isBidAccepted" BOOLEAN NOT NULL DEFAULT false,
    "isBid" BOOLEAN NOT NULL DEFAULT false,
    "isBidPlaceEventHappend" BOOLEAN NOT NULL DEFAULT false,
    "isBidWithdrawEventHappend" BOOLEAN NOT NULL DEFAULT false,
    "isBidAcceptEventHappend" BOOLEAN NOT NULL DEFAULT false,
    "bidStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "purchaseDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "purchaseStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "featuredImage" TEXT,
    "category" TEXT,
    "description" TEXT,
    "jobDes" TEXT,
    "skills" TEXT[],
    "requirements" TEXT[],
    "location" TEXT,
    "salary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" INTEGER NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "txHash" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "blockNumber" INTEGER NOT NULL,
    "blockHash" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "gasPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gasUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cumulativeGasUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "txnFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisplayHomeTopCollection" (
    "id" SERIAL NOT NULL,
    "collectionId" INTEGER NOT NULL,
    "orderNumber" SERIAL NOT NULL,
    "isTopCollection" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisplayHomeTopCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisplayHomeFeaturedCollection" (
    "id" SERIAL NOT NULL,
    "collectionId" INTEGER NOT NULL,
    "orderNumber" SERIAL NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisplayHomeFeaturedCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisplayHomeCreatorApplication" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "orderNumber" SERIAL NOT NULL,
    "isCreator" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisplayHomeCreatorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisplayHomeLaunchPadApplication" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "orderNumber" SERIAL NOT NULL,
    "isLaunchPad" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisplayHomeLaunchPadApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisplayHomeUpcomingMint" (
    "id" SERIAL NOT NULL,
    "collectionId" INTEGER NOT NULL,
    "orderNumber" SERIAL NOT NULL,
    "isUpComing" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisplayHomeUpcomingMint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" SERIAL NOT NULL,
    "question" TEXT,
    "answer" TEXT,
    "order" SERIAL NOT NULL,
    "isPublish" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Verification_userId_key" ON "Verification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkWallet_address_key" ON "LinkWallet"("address");

-- CreateIndex
CREATE UNIQUE INDEX "LinkWallet_userId_key" ON "LinkWallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_applicationId_key" ON "Document"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialMediaLinks_applicationId_key" ON "SocialMediaLinks"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionQueue_userId_key" ON "SubscriptionQueue"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_collectionUUID_key" ON "Collection"("collectionUUID");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_colname_idx_key" ON "Collection"("colname_idx");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_contractAddress_key" ON "Collection"("contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "NFT_tokenId_key" ON "NFT"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "NFT_name_idx_key" ON "NFT"("name_idx");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_listingId_key" ON "Purchase"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_txHash_key" ON "Transaction"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "DisplayHomeTopCollection_collectionId_key" ON "DisplayHomeTopCollection"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "DisplayHomeFeaturedCollection_collectionId_key" ON "DisplayHomeFeaturedCollection"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "DisplayHomeCreatorApplication_applicationId_key" ON "DisplayHomeCreatorApplication"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "DisplayHomeLaunchPadApplication_applicationId_key" ON "DisplayHomeLaunchPadApplication"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "DisplayHomeUpcomingMint_collectionId_key" ON "DisplayHomeUpcomingMint"("collectionId");

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkWallet" ADD CONSTRAINT "LinkWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backers" ADD CONSTRAINT "Backers_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMediaLinks" ADD CONSTRAINT "SocialMediaLinks_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPackage" ADD CONSTRAINT "SubscriptionPackage_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_subscriptionPackageId_fkey" FOREIGN KEY ("subscriptionPackageId") REFERENCES "SubscriptionPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionQueue" ADD CONSTRAINT "SubscriptionQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionQueue" ADD CONSTRAINT "SubscriptionQueue_requestedPackageId_fkey" FOREIGN KEY ("requestedPackageId") REFERENCES "SubscriptionPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFT" ADD CONSTRAINT "NFT_ownerOfId_fkey" FOREIGN KEY ("ownerOfId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFT" ADD CONSTRAINT "NFT_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaData" ADD CONSTRAINT "MetaData_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaData" ADD CONSTRAINT "MetaData_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisplayHomeTopCollection" ADD CONSTRAINT "DisplayHomeTopCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisplayHomeFeaturedCollection" ADD CONSTRAINT "DisplayHomeFeaturedCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisplayHomeCreatorApplication" ADD CONSTRAINT "DisplayHomeCreatorApplication_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisplayHomeLaunchPadApplication" ADD CONSTRAINT "DisplayHomeLaunchPadApplication_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisplayHomeUpcomingMint" ADD CONSTRAINT "DisplayHomeUpcomingMint_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
