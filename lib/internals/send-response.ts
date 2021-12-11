import type { NextApiResponse } from 'next';
import { setAllHeaders } from './utils';

export async function sendResponse(res: NextApiResponse, apiRes: ResultResponse) {
  if (apiRes.statusText) {
    res.statusMessage = apiRes.statusText;
    res.status(apiRes.status);
  }

  setAllHeaders(res, apiRes.headers);

  await new Promise((resolve, reject) => {
    apiRes.data.pipe(res);
    apiRes.data.on('end', resolve);
    apiRes.data.on('error', reject);
  });
}
