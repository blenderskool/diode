/*
  Warnings:

  - A unique constraint covering the columns `[projectId,name]` on the table `ApiRoute` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ApiRoute_projectId_name_key" ON "ApiRoute"("projectId", "name");
