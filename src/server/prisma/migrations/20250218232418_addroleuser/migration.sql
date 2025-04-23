-- AlterTable
ALTER TABLE "UserBot" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user',
ALTER COLUMN "location" SET DEFAULT ST_SetSRID(ST_MakePoint(0, 0), 4326);
