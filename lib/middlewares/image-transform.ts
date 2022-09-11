import type { NextApiRequest, NextApiResponse } from 'next';
import sharp, { FitEnum, FormatEnum } from 'sharp';
import { getType } from 'mime';

import { ApiRouteWithMiddlewares } from 'pages/api/v1/_types';

export interface ImageTransformationOptions extends MiddlewareOptions {};

const getValue = <T = string>(query: string | string[], parse: (val: string) => T, defaultVal: T = undefined): T => {
  if (Array.isArray(query)) {
    return parse(query[0]);
  } else {
    return query ? parse(query) : defaultVal;
  }
}

const remap = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => 
  (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;

const MASKS = {
  circle: (radius) => Buffer.from(
    `<svg><circle cx="${radius}" cy="${radius}" r="${radius}"/></svg>`
  ),
  ellipse: (width: number, height: number) => Buffer.from(
    `<svg><rect x="0" y="0" width="${width}" height="${height}" rx="${width/2}" ry="${height/2}"/></svg>`
  ),
}

const createMasks = (mask: keyof typeof MASKS, info: sharp.OutputInfo) => {
  const masks = [];
  switch(mask) {
    case 'circle':
      masks.push({
        input: MASKS.circle(Math.min(info.width, info.height)/2),
        blend: 'dest-in'
      });
      break;
    case 'ellipse':
      masks.push({
        input: MASKS.ellipse(info.width, info.height),
        blend: 'dest-in'
      });
      break;
  }

  return masks;
}

export function imageTransformation(apiRoute: ApiRouteWithMiddlewares, transforms: URLSearchParams) {
  return async (req: NextApiRequest, res: NextApiResponse, next) => {
    const imageTransformation = apiRoute.imageTransformation as ImageTransformationOptions;
    if (!imageTransformation.enabled) {
      next();
      return;
    }

    const w = getValue(transforms.get('w'), parseInt);
    const h = getValue(transforms.get('h'), parseInt);
    const fit = getValue(transforms.get('fit'), String, 'cover') as keyof FitEnum;
    const format = getValue(transforms.get('fm'), String, 'png') as keyof FormatEnum;
    const quality = getValue(transforms.get('q'), parseInt);
    const colors = getValue(transforms.get('colorquant'), parseInt);
    const crop = getValue(transforms.get('crop'), (s) => sharp.strategy[s], 'center');
    const blur = getValue(transforms.get('blur'), parseInt, 0);
    const saturation = remap(getValue(transforms.get('sat'), parseInt, 0), -100, 100, 0, 2);
    const brightness = remap(getValue(transforms.get('bright'), parseInt, 0), -100, 100, 0, 2);
    const contrast = remap(getValue(transforms.get('cont'), parseInt, 0), -100, 100, 0, 2);
    const progressive = getValue(transforms.get('prog'), Boolean, false);
    const mask = getValue(transforms.get('mask'), String, null) as keyof typeof MASKS;

    const image = req.locals.result.data;

    /**
     * First pass resizes the image so that the mask can use
     * resized widths and heights.
     */
    const { data: resized, info } = await sharp(image)
      .resize({
        width: w,
        height: h,
        fit,
        position: crop,
      })
      .toBuffer({ resolveWithObject: true });

    const output = await sharp(resized)
      .blur(blur === 0 ? false : 1 + blur / 2)
      .modulate({
        brightness: brightness,
        saturation: saturation,
      })
      .linear(contrast, -(128 * contrast) + 128)
      .composite([
        ...createMasks(mask, info),
      ])
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