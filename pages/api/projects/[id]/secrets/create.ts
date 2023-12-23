import type { NextApiRequest, NextApiResponse } from 'next';
import { encryptSecret } from '@/lib/internals/secrets';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const projectId = req.query.id as string;
  const { name, value } = req.body;
  const newSecret = await prisma.secret.create({
    data: {
      name,
      secret: encryptSecret(value),
      projectId,
    },
  });

  res.status(200).json(newSecret);
}
