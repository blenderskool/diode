import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiMethod } from '@prisma/client';
import axios from 'axios';
import { URL } from 'url';

import type { ApiRouteWithProjectSecrets, QueryParams, ExpandedHeaders } from './_types';

import getApiRoute from '../../../lib/internals/get-api-route';
import { sendResponse } from '../../../lib/internals/send-response';
import { addQueryParams, expandObjectEntries, mergeHeaders, movingAverage } from '../../../lib/internals/utils';
import { middlewareCache, middlewareRatelimit, middlewareRestriction } from '../../../lib/middlewares';
import prisma from '../../../lib/prisma';


// This code is from Next.js API Routes Middleware docs
// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function): Promise<any> {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        res.status(500).send(result.message);
        return;
      }

      return resolve(result);
    });
  });
}

/**
 * 
 * API format: diode.com/api/v1/[:api-id]/[:path]?query=
 * 
 * @param req 
 * @param res 
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get ApiRoute object from database
  const { apiRoute, path }: { apiRoute: ApiRouteWithProjectSecrets, path: string[] } = await runMiddleware(req, res, getApiRoute);

  if (req.method !== "OPTIONS" && req.method !== apiRoute.method) {
    // Incorrect request method used
    res.status(405).send("Method not allowed");
    return;
  }

  // Middleware plugins
  await runMiddleware(req, res, middlewareRestriction(apiRoute));
  await runMiddleware(req, res, middlewareRatelimit(apiRoute));
  await runMiddleware(req, res, middlewareCache(apiRoute));

  // Request preparation
  const requestUrl = new URL(`${apiRoute.apiUrl}/${path.join('/')}`);
  const currentQueryParams: QueryParams = expandObjectEntries(req.query);
  // Add query params
  addQueryParams(requestUrl, apiRoute.queryParams as QueryParams);
  addQueryParams(requestUrl, currentQueryParams);

  // Add request headers
  delete req.headers.host;
  const currentHeaders: ExpandedHeaders = expandObjectEntries(req.headers);
  const requestHeaders = mergeHeaders(apiRoute.headers as ExpandedHeaders, currentHeaders);

  // Request made
  try {
    const startTime = performance.now();
    const apiResponse = await axios.request({
      method: apiRoute.method,
      url: requestUrl.toString(),
      headers: requestHeaders,

      /**
       * Get response as stream and prevent its decoding
       * as proxy does not consume the result
       */
      decompress: false,
      responseType: 'stream',

      data: apiRoute.method === ApiMethod.GET ? undefined : req.body,
    });
    const timeTaken = performance.now() - startTime;
    const newAverage = movingAverage(apiRoute, timeTaken);

    // Response preparation
    sendResponse(res, apiResponse);
    await prisma.$executeRaw`UPDATE "public"."ApiRoute" SET "successes" = "successes" + 1, "avgResponseMs" = ${newAverage} WHERE "public"."ApiRoute"."id" = ${apiRoute.id}`;
  } catch(err) {
    if (axios.isAxiosError(err)) {
      // Response preparation
      // TODO: Handle case when err.response is undefined
      console.log("Axios error", err);
      sendResponse(res, err.response);
      await prisma.$executeRaw`UPDATE "public"."ApiRoute" SET "fails" = "fails" + 1 WHERE "public"."ApiRoute"."id" = ${apiRoute.id}`;
    } else {
      console.log("An error occurred!", err);
      res.status(500).send("Error occurred");
    }
  }
}
