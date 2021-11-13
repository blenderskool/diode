import { Box, Link } from '@chakra-ui/react';

export default function Footer(props) {
  return (
    <Box mt="auto" textAlign="center" color="gray.600" {...props}>
      Made in 🇮🇳 by <Link href="https://akashhamirwasia.com" fontWeight="500" color="green.500" isExternal>Akash Hamirwasia</Link>
    </Box>
  );
}
