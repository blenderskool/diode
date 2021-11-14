import { Heading, Text } from '@chakra-ui/react';

type Props = {
  heading: string;
  children?: React.ReactNode;
};

export default function SectionHeading({ heading, children }: Props) {
  return (
    <div>
      <Heading size="md" fontWeight="800" color="gray.600">{heading}</Heading>
      {children !== undefined && (
        <Text mt="2" color="gray.600" lineHeight="tall" fontSize="sm">
          {children}
        </Text>
      )}
    </div>
  );
}
