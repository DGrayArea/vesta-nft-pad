-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "logoImage" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "txHash" DROP NOT NULL,
ALTER COLUMN "contractAddress" DROP NOT NULL,
ALTER COLUMN "method" DROP NOT NULL,
ALTER COLUMN "tokenId" DROP NOT NULL,
ALTER COLUMN "price" DROP NOT NULL,
ALTER COLUMN "blockNumber" DROP NOT NULL,
ALTER COLUMN "blockHash" DROP NOT NULL,
ALTER COLUMN "to" DROP NOT NULL,
ALTER COLUMN "from" DROP NOT NULL,
ALTER COLUMN "gasPrice" DROP NOT NULL,
ALTER COLUMN "gasUsed" DROP NOT NULL,
ALTER COLUMN "cumulativeGasUsed" DROP NOT NULL,
ALTER COLUMN "txnFee" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "RequestCorrection" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestCorrection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RequestCorrection" ADD CONSTRAINT "RequestCorrection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
