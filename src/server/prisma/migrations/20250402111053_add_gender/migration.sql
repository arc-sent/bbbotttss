-- AlterTable
ALTER TABLE "Advertisement" ALTER COLUMN "due" SET DEFAULT (NOW() + INTERVAL '1 day');

-- AlterTable
ALTER TABLE "UserBot" ADD COLUMN     "gender" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "location" SET DEFAULT ST_SetSRID(ST_MakePoint(0, 0), 4326);
