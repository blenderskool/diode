import { Prisma } from '@prisma/client';

export type QueryParams = [string, string][];

export type ExpandedHeaders = [string, string][];

const ApiRouteWithProjectSecrets = Prisma.validator<Prisma.ApiRouteArgs>()({
  include: {
    project: {
      select: {
        id: true,
        Secret: true
      }
    }
  }
});

export type ApiRouteWithProjectSecrets = Prisma.ApiRouteGetPayload<typeof ApiRouteWithProjectSecrets>;
