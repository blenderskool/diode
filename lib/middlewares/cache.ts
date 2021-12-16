import { ApiMethod } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { OutgoingHttpHeaders } from 'http';
import getStream from 'get-stream';
import { Readable } from 'stream';

import redis from '../redis';
import { setAllHeaders } from '../internals/utils';
import { ApiRouteWithMiddlewares } from '../../pages/api/v1/_types';

export type CachingOptions = {
  enabled: boolean;
  // Duration in seconds
  duration: number;
};

/**
 * Caches the result and headers from the API and returns it for some duration before refetching
 * @param apiRoute ApiRoute object
 * @returns middleware function
 */
export default function cache(apiRoute: ApiRouteWithMiddlewares) {
  return async (req: NextApiRequest, res: NextApiResponse, next) => {
    const cachingOpts = apiRoute.caching as CachingOptions;
    // Caching is only supported on GET requests
    if (!cachingOpts.enabled || apiRoute.method !== ApiMethod.GET) {
      next();
      return;
    }

    const key = `cache:${apiRoute.method}:${req.url}`;

    /**
     * try catch not applied here as the docs say that err is always null,
     * and errors from specific commands are available in result returned
     */
    const [[cachedHeadersError, cachedHeaders], [cacheAgeError, cacheAge], [cachedResultError, cachedResult]] = await redis.pipeline()
      .get(`${key}:headers`)
      .ttl(`${key}:headers`)
      .getBuffer(`${key}:response`)
      .exec();

    if (!cachedHeadersError && !cacheAgeError && !cachedResultError && cachedHeaders) {
      console.log("Cache middleware: HIT!");
      const headers: OutgoingHttpHeaders = JSON.parse(cachedHeaders);

      setAllHeaders(res, headers);
      res
        .setHeader('cache-control', `max-age=${Math.max(0, cacheAge)}`)
        .status(200);
      Readable.from(cachedResult).pipe(res);
      return;
    }

    // Listen to data piped into response
    res.on('pipe', async (apiData) => {
      // Cache the data only if the request was a success
      if (res.statusCode === 200) {
        const { duration } = cachingOpts;
        res.setHeader('cache-control', `max-age=${Math.max(0, duration)}`);

        const headers = JSON.stringify(res.getHeaders());
        const buffer = await getStream.buffer(apiData);
        // TODO: Handle errors from below commands
        await redis
          .pipeline()
          .setex(`${key}:headers`, duration, headers)
          .setex(`${key}:response`, duration, buffer)
          .exec();

        console.log("Cache middleware: Added to cache");
      }
    });

    next();
  };
}
