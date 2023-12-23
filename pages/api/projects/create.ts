import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const { name } = req.body;
  const newProject = await prisma.project.create({
    data: { name },
  });

  res.status(200).json(newProject);
}
