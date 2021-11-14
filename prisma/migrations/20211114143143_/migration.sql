-- DropForeignKey
ALTER TABLE "ApiRoute" DROP CONSTRAINT "ApiRoute_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Secret" DROP CONSTRAINT "Secret_projectId_fkey";

-- AddForeignKey
ALTER TABLE "ApiRoute" ADD CONSTRAINT "ApiRoute_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Secret" ADD CONSTRAINT "Secret_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
