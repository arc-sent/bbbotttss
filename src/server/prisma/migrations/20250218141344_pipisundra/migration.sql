-- AlterTable
ALTER TABLE "UserBot" ADD COLUMN     "viewed" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "location" SET DEFAULT ST_SetSRID(ST_MakePoint(0, 0), 4326);
