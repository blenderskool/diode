import type { NextApiRequest, NextApiResponse } from 'next';
import sharp, { FitEnum, FormatEnum } from 'sharp';

import { ApiRouteWithMiddlewares } from 'pages/api/v1/_types';

export interface ImageTransformationOptions extends MiddlewareOptions {
};

const getValue = <T = string>(query: string | string[], parse: (val: string) => T, defaultVal: T = undefined): T => {
  if (Array.isArray(query)) {
    return parse(query[0]);
  } else {
    return query ? parse(query) : defaultVal;
  }
}

export const imageTransformationReader = (apiRoute: ApiRouteWithMiddlewares) => (req: NextApiRequest, res: NextApiResponse, next) => {
  const imageTransformation = apiRoute.imageTransformation as ImageTransformationOptions;
  if (!imageTransformation.enabled) {
    next();
    return;
  }

  req.locals.url = getValue(req.query['diode-image'], String);
  next();
}

export function imageTransformation(apiRoute: ApiRouteWithMiddlewares) {
  return async (req: NextApiRequest, res: NextApiResponse, next) => {
    const imageTransformation = apiRoute.imageTransformation as ImageTransformationOptions;
    if (!imageTransformation.enabled) {
      next();
      return;
    }

    const w = getValue(req.query.w, parseInt);
    const h = getValue(req.query.h, parseInt);
    const fit = getValue(req.query.fit, String, 'cover') as keyof FitEnum;
    const format = getValue(req.query.fm, String, 'png') as keyof FormatEnum;
    const quality = getValue(req.query.q, parseInt);
    const colors = getValue(req.query.colorquant, parseInt);
    const crop = getValue(req.query.crop, (s) => sharp.strategy[s], 'center');

    const image = req.locals.result.data;

    const output = await sharp(image)
      .resize({
        width: w,
        height: h,
        fit,
        position: crop,
      })
      .toFormat(format, {
        quality,
        colors,
      })
      .toBuffer();

    req.locals.result = {
      data: output,
      headers: {
        ...req.locals.result.headers,
        'Content-Type': `image/${format}`
      }
    };
    next();
  };
}