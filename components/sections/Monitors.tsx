import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  StyleProps,
  Text,
  chakra,
  useToast,
} from '@chakra-ui/react';
import { PlusIcon } from '@heroicons/react/outline';
import { Monitor, Project, Secret } from '@prisma/client';
import axios from 'axios';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { SecretInput, SectionHeading } from '@/components/ui';
import ProjectSecrets from '@/lib/contexts/ProjectSecrets';

type Props = StyleProps & {
  project: Project & {
    Monitor: Pick<Monitor, 'id' | 'name'>[];
    Secret: Pick<Secret, 'name'>[];
  };
};

type NewMonitorFormData = {
  name: string;
  apiUrl: string;
};

export default function Monitors({ project, ...props }: Props) {
  const {
    getValues: getNewFormValues,
    control,
    register: registerNewForm,
    handleSubmit: handleNewFormSubmit,
    formState: { isSubmitting: isCreatingMonitor },
  } = useForm<NewMonitorFormData>({
    defaultValues: {
      name: '',
      apiUrl: '',
    },
  });

  const [showCreationModal, setShowCreationModal] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const createMonitor = async () => {
    if (isCreatingMonitor) return;

    try {
      const response = await axios.post(`/api/monitors/create`, {
        ...getNewFormValues(),
        projectId: project.id,
      });
      const newMonitorId = response.data.id as string;
      router.push(`/projects/${project.id}/monitors/${newMonitorId}`);
    } catch (err) {
      console.log(err);
      toast({
        status: 'error',
        title:
          'Ah! An error occurred while creating the monitor, maybe try again?',
      });
    } finally {
      setShowCreationModal(false);
    }
  };

  return (
    <ProjectSecrets.Provider value={project.Secret}>
      <Box {...props}>
        <Flex justifyContent="space-between">
          <SectionHeading heading="🔭 Monitors">
            Monitors that are configured with Diode.
          </SectionHeading>
          <Button
            onClick={() => setShowCreationModal(true)}
            colorScheme="green"
            bg="green.400"
            rightIcon={<PlusIcon width="16" />}
          >
            New Monitor
          </Button>
        </Flex>
        <Box mt="8">
          {project.Monitor.map((monitor) => (
            <Box
              key={monitor.id}
              position="relative"
              border="1px"
              borderColor="gray.200"
              bg="white"
              transition="all 150ms ease-out"
              _first={{ roundedTop: 'md' }}
              _notFirst={{ mt: -1 }}
              _last={{ roundedBottom: 'md' }}
              _hover={{ bg: 'gray.50' }}
            >
              <Flex alignItems="center" py="3" px="6">
                <Text fontWeight="600">
                  <NextLink
                    href={`/projects/${project.id}/monitors/${monitor.id}`}
                  >
                    <chakra.span position="absolute" inset="0" />
                    {monitor.name}
                  </NextLink>
                </Text>
              </Flex>
            </Box>
          ))}
          {!project.Monitor.length && (
            <Box mt="16" color="gray.600" fontWeight="600" textAlign="center">
              No Monitors configured. Let&apos;s add one! 🔭
            </Box>
          )}
        </Box>
      </Box>

      <Modal
        size="lg"
        isOpen={showCreationModal}
        onClose={() => setShowCreationModal(false)}
      >
        <ModalOverlay />
        <ModalContent p="2" pt="4">
          <ModalHeader>
            <Heading fontFamily="heading" fontWeight="700" fontSize="2xl">
              New Monitor
            </Heading>
            <Text fontSize="small" color="gray.500" fontWeight="500" mt="2">
              Let's start building your monitor now! 💪
            </Text>
          </ModalHeader>
          <form onSubmit={handleNewFormSubmit(createMonitor)}>
            <ModalBody py={8}>
              <FormControl>
                <FormLabel>Monitor name</FormLabel>
                <Input
                  placeholder="Backend service health"
                  required
                  {...registerNewForm('name')}
                />
              </FormControl>
              <FormControl mt="8">
                <FormLabel>Endpoint URL</FormLabel>
                <SecretInput
                  inputProps={{
                    type: 'url',
                    placeholder: 'https://api.example.com',
                    required: true,
                  }}
                  control={control}
                  name="apiUrl"
                />
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button
                type="submit"
                colorScheme="green"
                bg="green.400"
                width="full"
                isLoading={isCreatingMonitor}
              >
                Create &amp; configure Monitor ›
              </Button>
            </ModalFooter>
          </form>

          <ModalCloseButton />
        </ModalContent>
      </Modal>
    </ProjectSecrets.Provider>
  );
}
