-- CreateTable
CREATE TABLE "MetchProfile" (
    "idPrisma" SERIAL NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "fromId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MetchProfile_pkey" PRIMARY KEY ("idPrisma")
);

-- AddForeignKey
ALTER TABLE "MetchProfile" ADD CONSTRAINT "MetchProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserBot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
