import type { NextApiResponse } from 'next';
import { setAllHeaders } from './utils';

export function sendResponse(res: NextApiResponse, apiRes: ResultResponse) {
  if (apiRes.statusText) {
    res.statusMessage = apiRes.statusText;
    res.status(apiRes.status);
  }

  setAllHeaders(res, apiRes.headers);
  res.send(apiRes.data);
}
