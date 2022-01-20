import { Tag, TagProps } from '@chakra-ui/react';
import { ApiMethod } from '@prisma/client';

type Props = TagProps & {
  method: ApiMethod;
};

const colors: Record<ApiMethod, string> = {
  GET: "green",
  POST: "yellow",
  PUT: "blue",
  DELETE: "red",
};

export default function ApiMethodTag({ method, ...props }: Props) {
  return <Tag colorScheme={colors[method]} {...props}>{method}</Tag>;
}
