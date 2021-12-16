/*
  Warnings:

  - You are about to drop the column `allowedIps` on the `ApiRoute` table. All the data in the column will be lost.
  - You are about to drop the column `allowedOrigins` on the `ApiRoute` table. All the data in the column will be lost.
  - The `restriction` column on the `ApiRoute` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ApiRoute" DROP COLUMN "allowedIps",
DROP COLUMN "allowedOrigins",
DROP COLUMN "restriction",
ADD COLUMN     "restriction" JSONB NOT NULL DEFAULT E'{}';

-- DropEnum
DROP TYPE "Restriction";
