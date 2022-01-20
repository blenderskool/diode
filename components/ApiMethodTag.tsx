import { Tag, TagProps } from '@chakra-ui/react';
import { ApiMethod } from '@prisma/client';

type Props = TagProps & {
  method: ApiMethod;
};

const config: Record<ApiMethod, TagProps> = {
  GET: {
    children: "GET",
    colorScheme: "green",
  },
  POST: {
    children: "POST",
    colorScheme: "yellow",
  },
  PUT: {
    children: "PUT",
    colorScheme: "blue",
  },
  DELETE: {
    children: "DEL",
    colorScheme: "red",
  },
};

export default function ApiMethodTag({ method, ...props }: Props) {
  return <Tag {...config[method]} {...props} />;
}
