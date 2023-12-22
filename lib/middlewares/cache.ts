import { ApiMethod } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { OutgoingHttpHeaders } from 'http';
import getStream from 'get-stream';
import { Readable } from 'stream';

import redis from '../redis';
import { setAllHeaders } from '../internals/utils';
import { ApiRouteWithMiddlewares } from '../../pages/api/v1/types';

export interface CachingOptions extends MiddlewareOptions {
  // Duration in seconds
  duration: number;
};

const createCacheKey = (req: NextApiRequest, apiRoute: ApiRouteWithMiddlewares) => `cache:${apiRoute.method}:${req.url}`;

/**
 * Caches the result and headers from the API and returns it for some duration before refetching
 * @param apiRoute ApiRoute object
 * @returns middleware function
 */
export function cacheRead(apiRoute: ApiRouteWithMiddlewares) {
  return async (req: NextApiRequest, res: NextApiResponse, next) => {
    const cachingOpts = apiRoute.caching as CachingOptions;
    // Caching is only supported on GET requests
    if (!cachingOpts.enabled || apiRoute.method !== ApiMethod.GET) {
      next();
      return;
    }

    const key = createCacheKey(req, apiRoute);

    /**
     * try catch not applied here as the docs say that err is always null,
     * and errors from specific commands are available in result returned
     */
    const [[cachedHeadersError, cachedHeaders], [cacheAgeError, cacheAge], [cachedResultError, cachedResult]] = await redis.pipeline()
      .get(`${key}:headers`)
      .ttl(`${key}:headers`)
      .getBuffer(`${key}:response`)
      .exec() as [[Error, string], [Error, number], [Error, Buffer]];

    if (!cachedHeadersError && !cacheAgeError && !cachedResultError && cachedHeaders) {
      console.log("Cache middleware: HIT!");
      const headers: OutgoingHttpHeaders = JSON.parse(cachedHeaders);

      setAllHeaders(res, headers);
      res.setHeader('cache-control', `max-age=${Math.max(0, cacheAge)}`)
      res.status(200).send(cachedResult);
    } else {
      next();
    }
  };
}

export function cacheWrite(apiRoute: ApiRouteWithMiddlewares) {
  return async (req: NextApiRequest, res: NextApiResponse, next) => {
    const cachingOpts = apiRoute.caching as CachingOptions;
    // Caching is only supported on GET requests
    if (!cachingOpts.enabled || apiRoute.method !== ApiMethod.GET) {
      next();
      return;
    }

    const key = createCacheKey(req, apiRoute);
    const { duration } = cachingOpts;

    const headers = JSON.stringify(req.locals.result.headers);
    const buffer = await getStream.buffer(req.locals.result.data);
    // TODO: Handle errors from below commands
    await redis
      .pipeline()
      .setex(`${key}:headers`, duration, headers)
      .setex(`${key}:response`, duration, buffer)
      .exec();

    console.log("Cache middleware: Added to cache");

    const resultReadable = new Readable();
    resultReadable.push(buffer);
    resultReadable.push(null);

    req.locals.result = {
      headers: {
        ...req.locals.result.headers,
        'cache-control': `max-age=${Math.max(0, duration)}`,
      },
      data: resultReadable,
    };
    next();
  }
}
