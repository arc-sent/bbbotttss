-- AlterTable
ALTER TABLE "UserBot" ADD COLUMN     "premiumTime" TIMESTAMP(3),
ADD COLUMN     "premiumType" TEXT,
ALTER COLUMN "location" SET DEFAULT ST_SetSRID(ST_MakePoint(0, 0), 4326);

-- CreateTable
CREATE TABLE "Payments" (
    "invoice_payload" SERIAL NOT NULL,
    "amountStar" INTEGER NOT NULL,
    "telegramId" INTEGER NOT NULL,
    "providerId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "userId" TEXT NOT NULL,

    CONSTRAINT "Payments_pkey" PRIMARY KEY ("invoice_payload")
);

-- AddForeignKey
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserBot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
