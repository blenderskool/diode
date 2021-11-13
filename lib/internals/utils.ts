import { NextApiResponse } from 'next';
import type { OutgoingHttpHeaders } from 'http';
import type { QueryParams, ExpandedHeaders } from '../../pages/api/v1/_types';
import type { ApiRoute } from '@prisma/client';

/**
 * Adds query params to the given URL object
 * @param url URL object
 * @param query query params
 */
export function addQueryParams(url: URL, query: QueryParams) {
  for(const [key, value] of query) {
    url.searchParams.append(key, value);
  }
}

/**
 * Many header objects are merged to single header object
 * @param manyHeaders headers to merge
 * @returns record with all headers merged
 */
export function mergeHeaders(...manyHeaders: ExpandedHeaders[]): Record<string, string> {
  const result = new Headers();

  for(const headers of manyHeaders) {
    for(const [key, value] of headers) {
      result.append(key, value);
    }
  }

  return Object.fromEntries(result);
}

/**
 * Applies all the specified headers to outgoing response
 * @param res outgoing response object
 * @param headers headers to add to the response
 */
export function setAllHeaders(res: NextApiResponse, headers: OutgoingHttpHeaders) {
  Object.entries(headers)
    .filter(([key]) => {
      /**
       * Remove access-control headers from API response as
       * custom ones will be added by "Restriction" middleware
       */
      return !key.toLowerCase().startsWith('access-control-');
    })
    .forEach(([key, value]) => value && res.setHeader(key, value));
}

/**
 * Flattens and returns all object entries with value as arrays
 * @param object object to get entries from
 * @returns all object entries as array
 */
export function expandObjectEntries(object: { [key: string]: string | string[] }) {
  const result: [string, string][] = [];
  for(const [key, value] of Object.entries(object)) {
    const arrayValue = Array.isArray(value) ? value : [ value ];
    arrayValue.forEach((value) => {
      result.push([ key, value ]);
    });
  }
  return result;
}

/**
 * Calculates a running average
 * @param apiRoute ApiRoute object
 * @param timeTaken current time taken
 * @returns computed average
 */
export function movingAverage(apiRoute: ApiRoute, timeTaken: number) {
  return Math.round((apiRoute.avgResponseMs * (apiRoute.successes) + timeTaken) / (apiRoute.successes + 1));
}
