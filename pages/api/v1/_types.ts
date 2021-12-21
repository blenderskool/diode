import { ApiRoute, Secret } from '@prisma/client';
import { CachingOptions } from '@/lib/middlewares/cache';
import { RateLimitingOptions } from '@/lib/middlewares/rate-limit';
import { RestrictionOptions } from '@/lib/middlewares/restriction';

export type QueryParams = [string, string][];

export type ExpandedHeaders = [string, string][];

export type ApiRouteWithMiddlewares = Omit<ApiRoute, 'restriction' | 'rateLimiting' | 'caching'> & {
  restriction: RestrictionOptions,
  rateLimiting: RateLimitingOptions,
  caching: CachingOptions,
};

export type ApiRouteWithProjectSecrets = ApiRouteWithMiddlewares & {
  project: {
    id: string;
    Secret: Secret[];
  };
};