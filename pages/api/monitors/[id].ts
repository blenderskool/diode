import type { NextApiRequest, NextApiResponse } from 'next';
import { URL } from 'url';
import prisma from '@/lib/prisma';
import { startMonitor } from '@/lib/internals/monitors';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const monitorId = req.query.id as string;

  switch (req.method) {
    case 'POST': {
      const { id, ...body } = req.body;
      const apiUrl = new URL(body.apiUrl);
      const queryParams = [...apiUrl.searchParams];
      await prisma.monitor.update({
        data: {
          ...req.body,
          apiUrl: apiUrl.origin + apiUrl.pathname,
          queryParams,
        },
        where: {
          id: monitorId,
        },
      });

      startMonitor(monitorId, body.frequency);

      res.status(200).send('Monitor updated successfully');
      break;
    }
    default:
      res.status(405).send('Method not allowed');
  }
}
