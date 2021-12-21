import { Flex, Input, IconButton, InputProps } from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { MouseEventHandler } from 'react';
import SecretInput, { SecretInputProps } from './SecretInput';

type Props = {
  keyProps: InputProps;
  valueProps: SecretInputProps;
  onRemove: MouseEventHandler<HTMLButtonElement>;
};

export default function QueryParamInput({ keyProps, valueProps, onRemove }: Props) {
  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      border="1px"
      borderColor="gray.200"
      py="3"
      px="6"
      bg="white"
      _first={{ roundedTop: "md" }}
      _notFirst={{ mt: -1 }}
      _last={{ roundedBottom: "md" }}
    >
      <Input
        placeholder="Field name"
        required
        {...keyProps}
      />
      <SecretInput
        containerProps={{ mx: "4" }}
        inputProps={{ placeholder: "Field value"  }}
        {...valueProps}
      />
      <IconButton
        icon={<DeleteIcon w={3} h={3} />}
        aria-label="Remove"
        size="sm"
        colorScheme="gray"
        onClick={onRemove}
      />
    </Flex>
  );
}
