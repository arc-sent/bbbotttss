/*
  Warnings:

  - You are about to drop the column `viewed` on the `UserBot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Advertisement" ALTER COLUMN "due" SET DEFAULT (NOW() + INTERVAL '1 day');

-- AlterTable
ALTER TABLE "UserBot" DROP COLUMN "viewed",
ALTER COLUMN "location" SET DEFAULT ST_SetSRID(ST_MakePoint(0, 0), 4326);

-- CreateTable
CREATE TABLE "ViewedProfile" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "premium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViewedProfile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ViewedProfile" ADD CONSTRAINT "ViewedProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserBot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
