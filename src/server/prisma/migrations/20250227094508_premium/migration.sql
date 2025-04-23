-- AlterTable
ALTER TABLE "UserBot" ADD COLUMN     "premium" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "location" SET DEFAULT ST_SetSRID(ST_MakePoint(0, 0), 4326);
