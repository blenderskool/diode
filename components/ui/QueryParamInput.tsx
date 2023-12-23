import { Flex, Input, IconButton, InputProps } from '@chakra-ui/react';
import { XIcon } from '@heroicons/react/outline';
import { MouseEventHandler } from 'react';
import SecretInput, { SecretInputProps } from './SecretInput';

type Props = {
  keyProps: InputProps;
  valueProps: SecretInputProps;
  onRemove: MouseEventHandler<HTMLButtonElement>;
};

export default function QueryParamInput({
  keyProps,
  valueProps,
  onRemove,
}: Props) {
  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      border="1px"
      borderColor="gray.100"
      p="3"
      bg="white"
      _first={{ roundedTop: 'md' }}
      _notFirst={{ mt: -1 }}
      _last={{ roundedBottom: 'md' }}
    >
      <Input
        placeholder="Field name"
        required
        borderColor="gray.200"
        borderRightRadius="none"
        borderRightWidth="0"
        {...keyProps}
      />
      <SecretInput
        containerProps={{
          borderColor: 'gray.200',
          borderLeftRadius: 'none',
          mr: '3',
        }}
        inputProps={{ placeholder: 'Field value' }}
        {...valueProps}
      />
      <IconButton
        icon={<XIcon width="16" />}
        variant="ghost"
        aria-label="Remove"
        size="sm"
        color="gray.500"
        onClick={onRemove}
      />
    </Flex>
  );
}
