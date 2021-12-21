import type { NextApiRequest, NextApiResponse } from 'next';
import { nanoid } from 'nanoid';
import { URL } from 'url';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send("Method not allowed");
  }

  const { name, method, projectId } = req.body;
  const apiUrl = new URL(req.body.apiUrl);

  // Handle multiple query params
  const queryParams = [...apiUrl.searchParams];

  const newRouteId = await prisma.apiRoute.create({
    data: {
      name,
      method,
      apiUrl: apiUrl.origin + apiUrl.pathname,
      projectId,
      id: nanoid(),
      caching: {},
      headers: [],
      queryParams,
      rateLimiting: {},
    },
    select: {
      id: true,
    },
  });

  res.status(200).json(newRouteId);
}
