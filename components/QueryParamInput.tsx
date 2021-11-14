import { Flex, Input, IconButton } from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { ChangeEventHandler, MouseEventHandler } from 'react';

type Props = {
  keyVal: string;
  valueVal: string;
  onKeyChange: ChangeEventHandler<HTMLInputElement>;
  onValueChange: ChangeEventHandler<HTMLInputElement>;
  onRemove: MouseEventHandler<HTMLButtonElement>;
};

export default function QueryParamInput({ keyVal, valueVal, onKeyChange, onValueChange, onRemove }: Props) {
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
        value={keyVal}
        onChange={onKeyChange}
      />
      <Input
        placeholder="Field value"
        mx="4"
        value={valueVal}
        onChange={onValueChange}
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
