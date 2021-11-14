import { Box, Flex, Heading, Text, Button, IconButton, Tooltip, Input, useToast } from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Project } from '@prisma/client';
import axios from 'axios';

import HelpText from '../../../components/HelpText';

type Props = {
  project: (Project & {
    Secret: {
      name: string;
    }[];
  });
  [key: string]: any;
};

export default function Secrets({ project, ...props }: Props) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newSecretName, setNewSecretName] = useState('');
  const [newSecretValue, setNewSecretValue] = useState('');
  const [creatingSecret, setCreatingSecret] = useState(false);
  const [deletingSecret, setDeletingSecret] = useState('');
  const toast = useToast();
  const router = useRouter();

  const closeCreation = () => {
    setShowNewForm(false);
    setNewSecretName('');
    setNewSecretValue('');
  };

  const createSecret = async (e) => {
    e.preventDefault();
    if (creatingSecret) return;

    if (project.Secret.some(({ name }) => name === newSecretName)) {
      toast({ status: "error", title: "Secret with this name already exists" });
      return;
    }

    setCreatingSecret(true);
    await axios.post(`/api/projects/${project.id}/secrets/create`, {
      name: newSecretName,
      value: newSecretValue,
    });
    setCreatingSecret(false);
    closeCreation();
    router.replace(router.asPath, undefined, { scroll: false });
  };

  const deleteSecret = async (secretName: string) => {
    if (deletingSecret) return;

    setDeletingSecret(secretName);
    await axios.delete(`/api/projects/${project.id}/secrets/${secretName}`);
    setDeletingSecret('');
    router.replace(router.asPath, undefined, { scroll: false });
  };

  return (
    <Box {...props}>
      <Flex justifyContent="space-between">
        <div>
          <Heading size="md" fontWeight="800" color="gray.600">🕶️ Secrets</Heading>
          <HelpText mt="2">
            Secrets are variables that can be consumed by the API endpoints in this project during calls.
            <br />
            These are <strong>encrypted and stored</strong> on the database.
          </HelpText>
        </div>
        <Button colorScheme="green" bg="green.400" rightIcon={<AddIcon w="3" h="3" />} onClick={() => setShowNewForm(true)}>
          New secret
        </Button>
      </Flex>
      <Box mt="8">
        {project.Secret.map(({ name }) => (
          <Flex
            key={name}
            justifyContent="space-between"
            alignItems="center"
            border="1px"
            borderColor="gray.200"
            py="3"
            px="6"
            bg="white"
            _first={{ roundedTop: "md" }}
            _notFirst={{ mt: -1 }}
            _last={{ roundedBottom: "md" }}
          >
            <Text fontWeight="600">{name}</Text>
            <Tooltip label="Not shown for security" fontSize="xs">
              <Text color="gray.500" letterSpacing="wide">•••••••••••••</Text>
            </Tooltip>
            <Tooltip label="Remove this secret" fontSize="xs">
              <IconButton
                icon={<DeleteIcon w={3} h={3} />}
                aria-label="Remove"
                size="sm"
                colorScheme="gray"
                isLoading={deletingSecret === name}
                onClick={() => deleteSecret(name)}
              />
            </Tooltip>
          </Flex>
        ))}
        {showNewForm && (
          <Flex border="1px" borderColor="gray.200" py="3" px="6" bg="white" _first={{ roundedTop: "md" }} _notFirst={{ mt: -1 }} _last={{ roundedBottom: "md" }}>
            <form onSubmit={createSecret} style={{ width: '100%' }}>
              <Flex justifyContent="space-between" alignItems="center">
                <Input placeholder="Secret name" required value={newSecretName} onChange={(e) => setNewSecretName(e.target.value)} />
                <Input placeholder="Secret value" required value={newSecretValue} onChange={(e) => setNewSecretValue(e.target.value)} mx={8} />

                <Button type="submit" size="sm" mr="2" px="6" colorScheme="green" bg="green.400" isLoading={creatingSecret}>
                  Save
                </Button>
                <Button type="button" size="sm" colorScheme="gray" px="6" onClick={closeCreation}>
                  Cancel
                </Button>
              </Flex>
            </form>
          </Flex>
        )}
        {project.Secret.length === 0 && !showNewForm && (
          <Box mt="16" color="gray.600" fontWeight="600" textAlign="center">
            No secrets added yet. Time to add one!  🕶️
          </Box>
        )}
      </Box>
    </Box>
  );
}
