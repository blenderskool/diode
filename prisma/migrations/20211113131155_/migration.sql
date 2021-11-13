-- CreateEnum
CREATE TYPE "Restriction" AS ENUM ('IP', 'HTTP');

-- AlterTable
ALTER TABLE "ApiRoute" ADD COLUMN     "allowedIps" TEXT[],
ADD COLUMN     "allowedOrigins" TEXT[],
ADD COLUMN     "restriction" "Restriction";
