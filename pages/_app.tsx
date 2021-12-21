import { Box, Flex, Container, ChakraProvider, extendTheme, ThemeConfig } from '@chakra-ui/react';
import '@fontsource/raleway/700.css';
import '@fontsource/raleway/800.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';

import { Footer, MockDeploymentBanner } from '@/components';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  fonts: {
    heading: "Raleway",
    body: "Inter",
  },
} as ThemeConfig);


const isMock = process.env.NEXT_PUBLIC_MOCK_DEPLOYMENT === "true";

function App({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      { isMock && <MockDeploymentBanner /> }
      <Box bg="gray.100">
        <Container maxWidth="container.lg">
          <Flex
            direction="column"
            pt="16"
            pb="8"
            px="16"
            minH={`calc(100vh - 4rem${isMock ? ' - 2rem' : ''})`}
            shadow="base"
            bg="white"
            rounded="base"
          >
            <Component {...pageProps} />
          </Flex>
        </Container>

        <Footer />
      </Box>
    </ChakraProvider>
  );
}

export default App;
