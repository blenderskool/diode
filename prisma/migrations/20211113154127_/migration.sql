-- AlterTable
ALTER TABLE "ApiRoute" ALTER COLUMN "queryParams" SET DEFAULT E'[]',
ALTER COLUMN "headers" SET DEFAULT E'[]',
ALTER COLUMN "rateLimiting" SET DEFAULT E'{}';
