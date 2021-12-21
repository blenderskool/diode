import { Box, BoxProps, Input, InputProps } from '@chakra-ui/react';
import { useContext, useRef } from 'react';
import { useController } from 'react-hook-form';
import ProjectSecrets from '@/lib/contexts/ProjectSecrets';

export type SecretInputProps = {
  name: string;
  control: any;
  inputProps?: React.HTMLProps<HTMLInputElement> & InputProps;
  highligerProps?: BoxProps;
  containerProps?: BoxProps;
};

export default function SecretInput({ name, control, containerProps = {}, inputProps: { required = false, ...props } }: SecretInputProps) {
  const { field } = useController({ control, name, rules: { required } });
  const highlighter = useRef(null);
  const projectSecrets = useContext(ProjectSecrets);

  const syncScroll = (e) => {
    highlighter.current.scrollTop = e.target.scrollTop;
    highlighter.current.scrollLeft = e.target.scrollLeft;
  };

  return (
    <Box
      h="10"
      width="100%"
      minWidth="0"
      border="1px solid"
      borderRadius="md"
      borderColor="inherit"
      position="relative"
      transitionProperty="common"
      transitionDuration="normal"
      _hover={{
        borderColor: "gray.300"
      }}
      _focusWithin={{
        borderColor: "blue.500",
        boxShadow: "0 0 0 1px #3182ce",
      }}
      {...containerProps}
    >
      <Box
        ref={highlighter}
        bg="inherit"
        height="10"
        width="calc(100% - 2rem)"
        minWidth="0"
        mx="4"
        fontSize="md"
        display="inline-flex"
        alignItems="center"
        pointerEvents="none"
        userSelect="none"
        flexWrap="nowrap"
        whiteSpace="pre"
        overflowX="auto"
        css={{
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
        {...props}
      >
        {
          field.value.split(/({{.*?}})/g).map((text, i) => {
            const secretMatch = text.match(/{{(.*?)}}/);
            if (secretMatch !== null) {
              const matchTrimmed = secretMatch[1].trim();
              const secretExists = projectSecrets.some(({ name }) => name.trim() === matchTrimmed);

              return (
                <Box
                  as="span"
                  key={i}
                  bg={secretExists ? 'green.50' : 'red.50'}
                  color={secretExists ? 'green.600' : 'red.600'}
                  borderRadius="2px"
                >
                  {text}
                </Box>
              );
            } else {
              return <Box as="span" key={i}>{text}</Box>;
            }
          })
        }
      </Box>
      <Input
        name={name}
        value={field.value}
        variant="unstyled"
        height="10"
        px="4"
        position="absolute"
        bg="transparent"
        left="0"
        top="0"
        css={{
          '&:not([value=""])': {
            WebkitTextFillColor: 'transparent',
          },
        }}
        autoComplete="off"
        spellCheck="false"
        onPaste={syncScroll}
        onCut={syncScroll}
        onFocus={syncScroll}
        onBlur={syncScroll}
        onWheel={syncScroll}
        onKeyDown={syncScroll}
        onKeyUp={syncScroll}
        onClick={syncScroll}
        onScroll={syncScroll}
        onDragOver={syncScroll}
        onChange={(e) => { syncScroll(e); field.onChange(e); }}
        {...props}
      />
    </Box>
  )
}
