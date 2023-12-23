import {
  Flex,
  Button,
  Modal,
  ModalOverlay,
  ModalCloseButton,
  ModalBody,
  ModalContent,
  ModalHeader,
  Heading,
  Text,
  UnorderedList,
  ListItem,
  Code,
} from '@chakra-ui/react';
import { useState } from 'react';

export default function MockDeploymentBanner() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Flex
        bg="red.100"
        h="8"
        color="red.600"
        fontWeight="semibold"
        fontSize="sm"
        alignItems="center"
        justifyContent="center"
      >
        This is a mock deployment, all features are still available in a limited
        capacity
        <Button
          colorScheme="red"
          size="xs"
          ml="4"
          onClick={() => setModalOpen(true)}
        >
          Read more
        </Button>
      </Flex>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalOverlay />
        <ModalContent p="2" pt="4">
          <ModalHeader>
            <Heading fontFamily="heading" fontWeight="700" fontSize="2xl">
              What is a mock deployment? 🧪
            </Heading>
          </ModalHeader>

          <ModalBody pb={8} pt={4}>
            <Text fontSize="small" color="gray.500" fontWeight="500" mt="2">
              Mock deployments are for{' '}
              <strong>testing and demonstration</strong> purposes. They are not
              intended for any serious or production use cases.
            </Text>
            <br />
            <UnorderedList fontSize="small" color="gray.500" fontWeight="500">
              <ListItem>In-memory Redis mock server is used.</ListItem>
              <ListItem>
                Data and functions state may not be persisted for longer
                durations. It can get cleared at any point.
              </ListItem>
            </UnorderedList>
            <br />
            <Text fontSize="small" color="gray.500" fontWeight="500">
              To use Diode 🔌 in production mode, set environment variable:
              <br />
              <Code>NEXT_PUBLIC_MOCK_DEPLOYMENT=&quot;false&quot;</Code>
            </Text>
          </ModalBody>

          <ModalCloseButton />
        </ModalContent>
      </Modal>
    </>
  );
}
