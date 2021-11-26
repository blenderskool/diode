import { Box, Flex, Container, ChakraProvider, extendTheme, ThemeConfig } from '@chakra-ui/react';
import "@fontsource/raleway/700.css";
import "@fontsource/raleway/800.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";

import Footer from '../components/Footer';
import MockDeploymentBanner from '../components/MockDeploymentBanner';

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

function App({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <MockDeploymentBanner />
      <Box bg="gray.100" minH="100vh">
        <Container shadow="base" bg="white" rounded="base" maxWidth="container.lg">
          <Flex direction="column" pt="16" pb="8" px="16" minH="100vh">
            <Component {...pageProps} />

            <Footer />
          </Flex>
        </Container>
      </Box>
    </ChakraProvider>
  );
}

export default App;
