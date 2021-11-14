import { Box, Flex, Button } from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import SectionHeading from '../../../components/SectionHeading';
import { useState } from 'react';

type Props = {
  onDelete: Function;
  buttonText: string;
  children?: React.ReactNode;
  [key: string]: any;
};

export default function DangerZone({ onDelete, buttonText, children, ...props }: Props) {
  const [deleting, setDeleting] = useState(false);

  const deleteHandler = async () => {
    if (deleting) return;

    try {
      setDeleting(true);
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box {...props}>
      <Flex justifyContent="space-between">
        <SectionHeading heading="🚨 Danger zone">
          {children}
        </SectionHeading>
        <Button
          colorScheme="red"
          color="red.500"
          variant="outline"
          rightIcon={<DeleteIcon w="3" h="3" />}
          onClick={deleteHandler}
          isLoading={deleting}
        >
          {buttonText}
        </Button>
      </Flex>
    </Box>
  )
}
