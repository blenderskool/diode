import type { NextApiRequest, NextApiResponse } from 'next';
import sharp, { FitEnum, FormatEnum } from 'sharp';
import { getType } from 'mime';

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

const remap = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => 
  (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;


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
    const blur = getValue(req.query.blur, parseInt, 0);
    const saturation = remap(getValue(req.query.sat, parseInt, 0), -100, 100, 0, 2);
    const brightness = remap(getValue(req.query.bright, parseInt, 0), -100, 100, 0, 2);
    const contrast = remap(getValue(req.query.cont, parseInt, 0), -100, 100, 0, 2);
    const progressive = getValue(req.query.prog, Boolean, false);

    const image = req.locals.result.data;

    const output = await sharp(image)
      .resize({
        width: w,
        height: h,
        fit,
        position: crop,
      })
      .blur(blur === 0 ? false : 1 + blur / 2)
      .modulate({
        brightness: brightness,
        saturation: saturation,
      })
      .linear(contrast, -(128 * contrast) + 128)
      .toFormat(format, {
        quality,
        colors,
        progressive,
      })
      .toBuffer();

    req.locals.result = {
      data: output,
      headers: {
        ...req.locals.result.headers,
        'Content-Type': getType(format),
      }
    };
    next();
  };
}