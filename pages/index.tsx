import type { NextPage } from 'next';
import { Flex, Heading } from '@chakra-ui/react';

const Home: NextPage = () => {
  return (
    <Flex height="300px" alignItems="center" justifyContent="center">
      <Heading as="h1" fontWeight="800">
        This is going to be great!
      </Heading>
    </Flex>
  );
};

export default Home;
