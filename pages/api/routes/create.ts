import type { NextApiRequest, NextApiResponse } from 'next';
import { nanoid } from 'nanoid';
import { URL } from 'url';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send("Method not allowed");
  }

  const { name, method, projectId } = req.body;
  let newRouteId: { id: string };

  if (typeof req.query.from === 'string') {
    // Duplicate existing API route
    const fromApiRoute = await prisma.apiRoute.findUnique({
      where: { id: req.query.from },
    });

    if (fromApiRoute === null) {
      // API route to duplicate from was not found
      res.status(400).send("Invalid API route id was passed to 'from' parameter");
      return;
    }

    newRouteId = await prisma.apiRoute.create({
      data: {
        ...fromApiRoute,
        name: name ?? fromApiRoute.name,
        id: nanoid(),
        successes: 0,
        fails: 0,
        avgResponseMs: 0,
      },
      select: { id: true },
    });
  } else {
    // Create a new API route
    const apiUrl = new URL(req.body.apiUrl);
    // Handle multiple query params
    const queryParams = [...apiUrl.searchParams];

    newRouteId = await prisma.apiRoute.create({
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
      select: { id: true },
    });
  }

  res.status(200).json(newRouteId);
}
