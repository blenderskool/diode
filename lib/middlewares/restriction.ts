import { ApiRoute, Restriction } from '@prisma/client';
import { IpFilter } from 'express-ipfilter';
import cors, { CorsOptions } from 'cors';

function createCorsOptions(apiRoute: ApiRoute): CorsOptions {
  return {
    origin(origin: string, callback: Function) {
      if (apiRoute.allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"), false);
      }
    },
    methods: apiRoute.method,
  };
}

/**
 * Restricts the Origins or IP addresses that can make requests to the endpoint
 * @param apiRoute ApiRoute object
 * @returns middleware function
 */
export default function middlewareRestriction(apiRoute: ApiRoute): Function {
  // No API restriction
  if (!apiRoute.restriction) return cors();

  switch (apiRoute.restriction) {
    case Restriction.IP:
      return IpFilter(apiRoute.allowedIps, { mode: 'allow' });
    case Restriction.HTTP:
      return cors(createCorsOptions(apiRoute));
    default:
      throw new Error("Invalid restriction type");
  }
}
