import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  fonts: {
    heading: 'Raleway',
    body: 'Inter',
  },
} as ThemeConfig);

export default theme;
