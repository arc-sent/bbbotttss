-- AlterTable
ALTER TABLE "UserBot" ADD COLUMN     "caseEveryDay" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "location" SET DEFAULT ST_SetSRID(ST_MakePoint(0, 0), 4326);
