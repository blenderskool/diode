import { ApiRoute, Secret } from '@prisma/client';
import { RestrictionOptions, RateLimitingOptions, CachingOptions, PartialQueryOptions, ImageTransformationOptions } from '@/lib/middlewares';

export type QueryParams = [string, string][];

export type ExpandedHeaders = [string, string][];

export type ApiRouteWithMiddlewares = Omit<ApiRoute, 'restriction' | 'rateLimiting' | 'caching' | 'partialQuery'> & {
  restriction: RestrictionOptions;
  rateLimiting: RateLimitingOptions;
  caching: CachingOptions;
  partialQuery: PartialQueryOptions;
  imageTransformation: ImageTransformationOptions;
};

export type ApiRouteWithProjectSecrets = ApiRouteWithMiddlewares & {
  project: {
    id: string;
    Secret: Secret[];
  };
};