import type { Project } from '@prisma/client';
import {
  Box,
  Flex,
  Text,
  Button,
  IconButton,
  Tooltip,
  Input,
  InputGroup,
  InputRightElement,
  useToast,
} from '@chakra-ui/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/outline';
import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useForm } from 'react-hook-form';

import { SectionHeading, confirmDialog } from '@/components/ui';

type Props = {
  project: Project & {
    Secret: {
      name: string;
    }[];
  };
  [key: string]: any;
};

type NewSecretFormData = {
  name: string;
  value: string;
};

export default function Secrets({ project, ...props }: Props) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [deletingSecret, setDeletingSecret] = useState('');
  const [showValue, setShowValue] = useState(false);
  const {
    register,
    getValues,
    handleSubmit,
    setValue,
    formState: { isSubmitting: creatingSecret },
  } = useForm<NewSecretFormData>();
  const toast = useToast();
  const router = useRouter();

  const closeCreation = () => {
    setShowNewForm(false);
    setValue('name', '');
    setValue('value', '');
  };

  const createSecret = async () => {
    if (creatingSecret) return;

    const newSecret = getValues();

    if (project.Secret.some(({ name }) => name === newSecret.name)) {
      toast({ status: 'error', title: 'Secret with this name already exists' });
      return;
    }

    await axios.post(`/api/projects/${project.id}/secrets/create`, newSecret);
    closeCreation();
    router.replace(router.asPath, undefined, { scroll: false });
  };

  const deleteSecret = async (secretName: string) => {
    if (deletingSecret) return;
    setDeletingSecret(secretName);

    const confirmed = await confirmDialog({
      title: `Delete ${secretName} secret`,
      description: `Deleting this secret will make all the references to ${secretName} in request URL, headers, query params an empty string. This action is irreversible.`,
      btnConfirmTxt: 'Delete Secret',
    });

    if (confirmed) {
      await axios.delete(`/api/projects/${project.id}/secrets/${secretName}`);
      router.replace(router.asPath, undefined, { scroll: false });
    }

    setDeletingSecret('');
  };

  return (
    <Box {...props}>
      <Flex justifyContent="space-between">
        <SectionHeading heading="🕶️ Secrets">
          Secrets are variables that can be consumed by the API endpoints in
          this project during calls.
          <br />
          These are <strong>encrypted and stored</strong> on the database.
        </SectionHeading>
        <Button
          colorScheme="green"
          bg="green.400"
          rightIcon={<PlusIcon width="16" />}
          onClick={() => setShowNewForm(true)}
        >
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
            _first={{ roundedTop: 'md' }}
            _notFirst={{ mt: -1 }}
            _last={{ roundedBottom: 'md' }}
          >
            <Text fontWeight="600">{name}</Text>
            <Tooltip label="Not shown for security" fontSize="xs">
              <Text color="gray.500" letterSpacing="wide">
                •••••••••••••
              </Text>
            </Tooltip>
            <Tooltip label="Remove this secret" fontSize="xs">
              <IconButton
                icon={<TrashIcon width="16" />}
                aria-label="Remove"
                variant="ghost"
                size="sm"
                colorScheme="gray"
                isLoading={deletingSecret === name}
                onClick={() => deleteSecret(name)}
              />
            </Tooltip>
          </Flex>
        ))}
        {showNewForm && (
          <Flex
            border="1px"
            borderColor="gray.200"
            p="3"
            bg="white"
            _first={{ roundedTop: 'md' }}
            _notFirst={{ mt: -1 }}
            _last={{ roundedBottom: 'md' }}
          >
            <form
              onSubmit={handleSubmit(createSecret)}
              style={{ width: '100%' }}
            >
              <Flex justifyContent="space-between" alignItems="center">
                <Input
                  placeholder="Secret name"
                  required
                  borderRightRadius="none"
                  borderRightWidth="0"
                  {...register('name')}
                />
                <InputGroup>
                  <Input
                    type={showValue ? 'text' : 'password'}
                    placeholder="Secret value"
                    required
                    pr="4rem"
                    borderLeftRadius="none"
                    {...register('value')}
                  />
                  <InputRightElement w="4rem">
                    <Button
                      size="xs"
                      h="1.75rem"
                      onClick={() => setShowValue(!showValue)}
                    >
                      {showValue ? 'Hide' : 'Show'}
                    </Button>
                  </InputRightElement>
                </InputGroup>

                <Button
                  type="submit"
                  size="sm"
                  ml="8"
                  mr="2"
                  px="6"
                  colorScheme="green"
                  bg="green.400"
                  isLoading={creatingSecret}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  colorScheme="gray"
                  px="6"
                  onClick={closeCreation}
                >
                  Cancel
                </Button>
              </Flex>
            </form>
          </Flex>
        )}
        {project.Secret.length === 0 && !showNewForm && (
          <Box mt="16" color="gray.600" fontWeight="600" textAlign="center">
            No secrets added yet. Time to add one! 🕶️
          </Box>
        )}
      </Box>
    </Box>
  );
}
