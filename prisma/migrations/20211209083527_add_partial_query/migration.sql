-- AlterTable
ALTER TABLE "ApiRoute" ADD COLUMN     "partialQuery" JSONB NOT NULL DEFAULT E'{}';
