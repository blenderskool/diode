import type { NextApiRequest, NextApiResponse } from 'next';
import { URL } from 'url';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiRouteId = req.query.id as string;

  switch(req.method) {
    case 'DELETE':
      await prisma.apiRoute.delete({
        where: { id: apiRouteId }
      });

      res.status(200).send("Api route deleted successfully");
      break;
    case 'POST': {
      const { id, ...body } = req.body;
      const apiUrl = new URL(body.apiUrl);
      const queryParams = [...apiUrl.searchParams];
      await prisma.apiRoute.update({
        data: {
          ...req.body,
          apiUrl: apiUrl.origin + apiUrl.pathname,
          queryParams,
        },
        where: {
          id: apiRouteId,
        },
      });
      res.status(200).send("Api route updated successfully");
      break;
    }
    default:
      res.status(405).send("Method not allowed");
  }
}
