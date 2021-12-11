import { IpFilter } from 'express-ipfilter';
import cors, { CorsOptions } from 'cors';
import { ApiRouteWithMiddlewares } from '../../pages/api/v1/_types';

export type RestrictionOptions = {
  enabled: boolean;
  type: 'HTTP' | 'IP';
  allowedOrigins: string[];
  allowedIps: string[];
};


function createCorsOptions(apiRoute: ApiRouteWithMiddlewares): CorsOptions {
  const { allowedOrigins } = apiRoute.restriction;
  return {
    origin(origin: string, callback: Function) {
      if (allowedOrigins.indexOf(origin) !== -1) {
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
export function restriction(apiRoute: ApiRouteWithMiddlewares): Function {
  // No API restriction
  const options = apiRoute.restriction;
  if (!options.enabled) return cors();

  switch (options.type) {
    case 'IP':
      return IpFilter(options.allowedIps, { mode: 'allow' });
    case 'HTTP':
      return cors(createCorsOptions(apiRoute));
    default:
      throw new Error("Invalid restriction type");
  }
}
