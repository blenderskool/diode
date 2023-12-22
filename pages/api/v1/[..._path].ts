import { ApiMethod } from '@prisma/client';
import axios from 'axios';
import { render } from 'micromustache';
import type { NextApiRequest, NextApiResponse } from 'next';
import { performance } from 'perf_hooks';
import { URL } from 'url';

import type { ApiRouteWithProjectSecrets, ExpandedHeaders, QueryParams } from './types';

import getApiRoute from '@/lib/internals/get-api-route';
import { decryptSecret } from '@/lib/internals/secrets';
import { sendResponse } from '@/lib/internals/send-response';
import { addQueryParams, expandObjectEntries, mergeHeaders, movingAverage, substituteSecrets } from '@/lib/internals/utils';
import * as middlewares from '@/lib/middlewares';
import prisma from '@/lib/prisma';


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
  req.locals = { result: null };

  // Get ApiRoute object from database
  const { apiRoute, path }: { apiRoute: ApiRouteWithProjectSecrets, path: string[] } = await runMiddleware(req, res, getApiRoute);

  if (req.method !== "OPTIONS" && req.method !== apiRoute.method) {
    // Incorrect request method used
    res.status(405).send("Method not allowed");
    return;
  }

  // Middleware plugins
  await runMiddleware(req, res, middlewares.restriction(apiRoute));
  await runMiddleware(req, res, middlewares.rateLimit(apiRoute));
  await runMiddleware(req, res, middlewares.cacheRead(apiRoute));

  // Decrypt the project secrets
  const secrets = Object.fromEntries(apiRoute.project.Secret.map(({ name, secret }) => [name, decryptSecret(secret)]));
  const apiUrl = encodeURI(render(decodeURI(apiRoute.apiUrl), secrets));

  // Request preparation
  const requestUrl = new URL(`${apiUrl}/${path.join('/')}`);
  const currentQueryParams: QueryParams = expandObjectEntries(req.query);
  // Add query params
  addQueryParams(requestUrl, substituteSecrets(apiRoute.queryParams as QueryParams, secrets));
  addQueryParams(requestUrl, currentQueryParams);

  // Add request headers
  delete req.headers.host;
  delete req.headers['accept-encoding'];
  const currentHeaders: ExpandedHeaders = expandObjectEntries(req.headers);
  const requestHeaders = mergeHeaders(substituteSecrets(apiRoute.headers as ExpandedHeaders, secrets), currentHeaders);

  // Request made
  try {
    const startTime = performance.now();
    const isPartialQueryEnabled = !!apiRoute.partialQuery.enabled && requestUrl.searchParams.has('diode-filter');
    const apiResponse = await axios.request({
      method: apiRoute.method,
      url: requestUrl.toString(),
      headers: requestHeaders,

      /**
       * Get response as stream and decode it
       * only if partial query middleware is enabled
       */
      decompress: isPartialQueryEnabled,
      responseType: 'stream',

      data: apiRoute.method === ApiMethod.GET ? undefined : req.body,
      validateStatus: (status) => status < 400
    });
    const timeTaken = performance.now() - startTime;
    
    req.locals.result = apiResponse;
  
    if (isPartialQueryEnabled && apiResponse.headers['content-type'].includes('application/json')) {
      /**
       * get() is used instead of getAll() as only the filter configured
       * either in dashboard or the incoming query param is used.
       * Not both to avoid confusion
       */
      await runMiddleware(req, res, middlewares.partialJsonQuery(requestUrl.searchParams.get('diode-filter')));
    }

    await runMiddleware(req, res, middlewares.cacheWrite(apiRoute));
    // Response preparation
    sendResponse(res, req.locals.result);

    const newResponseAverage = movingAverage(apiRoute, timeTaken);
    await prisma.$executeRaw`UPDATE "public"."ApiRoute" SET "successes" = "successes" + 1, "avgResponseMs" = ${newResponseAverage} WHERE "public"."ApiRoute"."id" = ${apiRoute.id}`;
  } catch(err) {
    if (axios.isAxiosError(err)) {
      // Response preparation
      // TODO: Handle case when err.response is undefined
      console.log("Axios error", err);
      if (err.response) {
        sendResponse(res, err.response);
      } else {
        res.status(500).send("Error occurred");
      }
      
      if (err.response || err.request) {
        // API route failures are tracked only when axios errors are thrown
        await prisma.$executeRaw`UPDATE "public"."ApiRoute" SET "fails" = "fails" + 1 WHERE "public"."ApiRoute"."id" = ${apiRoute.id}`;
      }      
    } else {
      console.log("An error occurred!", err);
      res.status(500).send("Error occurred");
    }
  }
}
