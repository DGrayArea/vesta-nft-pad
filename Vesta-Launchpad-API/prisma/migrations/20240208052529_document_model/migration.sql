-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "swotImageURL" TEXT,
ADD COLUMN     "taxDescription" TEXT;

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "saleSubType" TEXT,
ADD COLUMN     "uniqueOwnersCount" INTEGER DEFAULT 0,
ALTER COLUMN "totalNft" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "VestaDocument" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "url" TEXT,
    "size" DOUBLE PRECISION,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VestaDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VestaDocument" ADD CONSTRAINT "VestaDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
