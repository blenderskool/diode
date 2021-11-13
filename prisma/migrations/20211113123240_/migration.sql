-- CreateEnum
CREATE TYPE "ApiMethod" AS ENUM ('GET', 'POST', 'PUT', 'DELETE');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRoute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiUrl" TEXT NOT NULL,
    "method" "ApiMethod" NOT NULL,
    "queryParams" JSONB NOT NULL,
    "headers" JSONB NOT NULL,
    "projectId" TEXT NOT NULL,
    "rateLimiting" JSONB NOT NULL,

    CONSTRAINT "ApiRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Secret" (
    "secret" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "projectId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Secret_projectId_name_key" ON "Secret"("projectId", "name");

-- AddForeignKey
ALTER TABLE "ApiRoute" ADD CONSTRAINT "ApiRoute_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Secret" ADD CONSTRAINT "Secret_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
