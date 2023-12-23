import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const projectId = req.query.id as string;

  switch (req.method) {
    case 'DELETE':
      await prisma.project.delete({
        where: { id: projectId },
      });

      res.status(200).send('Project deleted successfully');
      break;
    default:
      res.status(405).send('Method not allowed');
  }
}
