import type { NextApiRequest, NextApiResponse } from 'next';
import * as mask from 'json-mask';

export interface PartialQueryOptions extends MiddlewareOptions {};

export function partialJsonQuery(filterString: string) {
  return async (req: NextApiRequest, res: NextApiResponse, next: Function) => {
    const resultBuffer = req.locals.result.data;
    // Below code is prone to errors if the body did not contain valid JSON data
    try {
      const resultData = mask(JSON.parse(resultBuffer as any), filterString);
      const output = Buffer.from(JSON.stringify(resultData), 'utf8');

      req.locals.result = {
        headers: { 'content-type': 'application/json' },
        data: output,
      };
    } catch(_) {
      // Handle errors here if _necessary_ in the future
    } finally {
      next();
    }
  };
}
