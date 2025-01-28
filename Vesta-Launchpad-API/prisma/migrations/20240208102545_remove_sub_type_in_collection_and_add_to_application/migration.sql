/*
  Warnings:

  - You are about to drop the column `saleSubType` on the `Collection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "subType" TEXT;

-- AlterTable
ALTER TABLE "Collection" DROP COLUMN "saleSubType";
