-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_brigadeId_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "brigadeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_brigadeId_fkey" FOREIGN KEY ("brigadeId") REFERENCES "Brigade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
