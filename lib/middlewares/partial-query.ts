import type { NextApiRequest, NextApiResponse } from 'next';
import { Readable } from 'stream';
import * as mask from 'json-mask';
import getStream from 'get-stream';

export interface PartialQueryOptions extends MiddlewareOptions {};

export function partialJsonQuery(filterString: string) {
  return async (req: NextApiRequest, res: NextApiResponse, next: Function) => {
    const resultBuffer = await getStream.buffer(req.locals.result.data);
    const resultData = mask(JSON.parse(resultBuffer as any), filterString);

    const resultReadable = new Readable();
    resultReadable.push(JSON.stringify(resultData));
    resultReadable.push(null);

    req.locals.result = {
      headers: { 'content-type': 'application/json' },
      data: resultReadable,
    };
    next();
  };
}
