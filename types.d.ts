import type { NextApiRequest as Req } from 'next';
import type { Stream } from 'stream';

declare global {
  interface ResultResponse {
    headers: Record<string, string>,
    data: Stream,
    [key: string]: any,
  }

  interface MiddlewareOptions {
    enabled: boolean;
  }
}

declare module 'next' {
  interface NextApiRequest extends Req {
    locals: {
      result: ResultResponse,
    },
  }
}