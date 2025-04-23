/*
  Warnings:

  - You are about to drop the column `count` on the `ViewedProfile` table. All the data in the column will be lost.
  - You are about to drop the column `premium` on the `ViewedProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Advertisement" ALTER COLUMN "due" SET DEFAULT (NOW() + INTERVAL '1 day');

-- AlterTable
ALTER TABLE "UserBot" ALTER COLUMN "location" SET DEFAULT ST_SetSRID(ST_MakePoint(0, 0), 4326);

-- AlterTable
ALTER TABLE "ViewedProfile" DROP COLUMN "count",
DROP COLUMN "premium";
