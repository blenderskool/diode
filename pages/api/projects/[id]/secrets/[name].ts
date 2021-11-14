import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const projectId = req.query.id as string;
  const name = req.query.name as string;

  switch(req.method) {
    case 'DELETE':
      await prisma.secret.delete({
        where: {
          projectId_name: { name, projectId },
        },
      });

      res.status(200).json("Secret deleted successfully");
      break;
    default:
      res.status(405).send("Method not allowed");
  }
}
