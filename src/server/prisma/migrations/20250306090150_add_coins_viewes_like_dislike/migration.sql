-- AlterTable
ALTER TABLE "UserBot" ADD COLUMN     "coin" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "coinWieved" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dislikeWieved" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "likeWieved" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "location" SET DEFAULT ST_SetSRID(ST_MakePoint(0, 0), 4326);
