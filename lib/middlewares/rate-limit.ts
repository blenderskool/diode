import type { ApiRoute } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import requestIp from 'request-ip';

import redis from '../redis';

export type RateLimitingOptions = {
  windowSize: number,
  maxRequests: number,
};

/**
 * Limits the number of requests that can be made within a specified time interval
 * @param apiRoute ApiRoute object
 * @returns middleware function
 */
export default function rateLimit(apiRoute: ApiRoute) {
  return async (req: NextApiRequest, res: NextApiResponse, next) => {
    const rateLimiting = apiRoute.rateLimiting as RateLimitingOptions;
    if (Object.keys(rateLimiting).length === 0) {
      next();
      return;
    }

    const key = `${apiRoute.id}:${requestIp.getClientIp(req)}`;
    const requests = await redis.incr(key);

    if (requests === 1) {
      await redis.expire(key, rateLimiting.windowSize);
    }
    // const ttl = await redis.ttl(key);

    if (requests > rateLimiting.maxRequests) {
      res.status(503).send("Too many requests made");
      return;
    }

    next();
  };
}
