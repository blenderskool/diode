import { Box, Link, Text } from '@chakra-ui/react';

export default function Footer(props) {
  return (
    <Box mt="auto" textAlign="center" color="gray.600" {...props}>
      <Text fontWeight="500">
        Diode is open source on
        {' '}
        <Link href="https://github.com/blenderskool/diode" fontWeight="500" color="green.500" isExternal>GitHub</Link>
      </Text>
      <Text mt="1">
        Made in 🇮🇳 by <Link href="https://akashhamirwasia.com" fontWeight="500" color="green.500" isExternal>Akash Hamirwasia</Link>
      </Text>
    </Box>
  );
}
