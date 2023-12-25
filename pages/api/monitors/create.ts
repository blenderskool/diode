import prisma from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import { URL } from 'url';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const { name, projectId } = req.body;

  // Create a new API route
  const apiUrl = new URL(req.body.apiUrl);
  // Handle multiple query params
  const queryParams = [...apiUrl.searchParams];

  const monitor = await prisma.monitor.create({
    data: {
      name,
      apiUrl: apiUrl.origin + apiUrl.pathname,
      projectId,
      queryParams,
    },
    select: { id: true },
  });

  res.status(200).json(monitor);
}
