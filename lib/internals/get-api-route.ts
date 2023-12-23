import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../prisma';

export default async function getApiRoute(
  req: NextApiRequest,
  res: NextApiResponse,
  next: Function
) {
  const { _path, ...query } = req.query as {
    _path: string[];
    [key: string]: string | string[];
  };

  if (_path.length === 0) {
    // Error
    res.status(400).send('API id is missing');
  }

  const [apiId, ...remainingPath] = _path;
  try {
    // Fetch the API route details from DB (including project id and secret data)
    const apiRoute = await prisma.apiRoute.findUniqueOrThrow({
      where: {
        id: apiId,
      },
      include: {
        project: {
          select: {
            id: true,
            Secret: true,
          },
        },
      },
    });

    // Replace the request query with the remaining query params so that _path is not misused
    req.query = query;

    /**
     * Remove query params and headers if request data forwarding is disabled.
     * No further middleware gets access to this data too.
     */
    if (!apiRoute.forwardRequestData) {
      req.query = {};
      req.headers = {};
      req.rawHeaders = [];
    }

    next({ apiRoute, path: remainingPath });
  } catch (err) {
    console.log(err);
    return res.status(400).send('Invalid endpoint');
  }
}
