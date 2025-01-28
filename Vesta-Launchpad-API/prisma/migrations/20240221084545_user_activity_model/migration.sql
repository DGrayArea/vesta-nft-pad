/*
  Warnings:

  - The `dateToGetinTouch` column on the `Application` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[applicationUUID]` on the table `Application` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uid]` on the table `Users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "applicationUUID" TEXT,
DROP COLUMN "dateToGetinTouch",
ADD COLUMN     "dateToGetinTouch" TIMESTAMP(3)[];

-- AlterTable
ALTER TABLE "Backers" ADD COLUMN     "profileImage" TEXT;

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "activity" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_applicationUUID_key" ON "Application"("applicationUUID");

-- CreateIndex
CREATE UNIQUE INDEX "Users_uid_key" ON "Users"("uid");

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
