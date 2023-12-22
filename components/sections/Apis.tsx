import { ApiMethod, Project } from '@prisma/client';
import NextLink from 'next/link';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  IconButton,
  Modal,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  Select,
  FormControl,
  FormLabel,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { DuplicateIcon, TrashIcon, DotsVerticalIcon, PlusIcon } from '@heroicons/react/outline';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import axios from 'axios';

import { SectionHeading, SecretInput, ApiMethodTag, confirmDialog } from '@/components/ui';
import ProjectSecrets from '@/lib/contexts/ProjectSecrets';

export const getServerSideProps = () => ({ props: {} });

type ApiRoute = {
  id: string;
  name: string;
  apiUrl: string;
  method: ApiMethod;
  successes: number;
  fails: number;
};

type Props = {
  project: (Project & {
    ApiRoute: ApiRoute[];
    Secret: {
      name: string;
    }[];
  });
  [key: string]: any;
};

type NewApiFormData = {
  name: string;
  method: ApiMethod;
  apiUrl: string;
};

type DuplicateApiFormData = {
  name: string;
  apiId: string;
};

export default function Apis({ project, ...props }: Props) {
  const {
    getValues: getNewFormValues,
    control,
    register: registerNewForm,
    handleSubmit: handleNewFormSubmit,
    formState: { isSubmitting: isCreatingApi }
  } = useForm<NewApiFormData>({
    defaultValues: {
      name: '',
      method: ApiMethod.GET,
      apiUrl: '',
    },
  });
  const {
    register: registerDuplicateForm,
    setValue: setDuplicateFormValue,
    getValues: getDuplicateFormValues,
    handleSubmit: handleDuplicateFormSubmit,
    formState: { isSubmitting: isDuplicatingApi },
  } = useForm<DuplicateApiFormData>({
    defaultValues: {
      name: '',
      apiId: '',
    },
  });
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [duplicateModal, setDuplicateModal] = useState({ show: false, fromApiName: '' });
  const [deletingApi, setDeletingApi] = useState('');
  const router = useRouter();
  const toast = useToast();

  const createApi = async () => {
    if (isCreatingApi) return;

    try {
      const response = await axios.post(`/api/routes/create`, {
        ...getNewFormValues(),
        projectId: project.id,
      });
      const newApiRouteId = response.data.id as string;
      router.push(`/projects/${project.id}/routes/${newApiRouteId}`);
    } catch(err) {
      console.log(err);
      toast({ status: "error", title: "Ah! An error occurred while creating the API route, maybe try again?" });
    } finally {
      setShowCreationModal(false);
    }
  };

  const duplicateApi = async () => {
    if (isDuplicatingApi) return;

    try {
      const { apiId, name } = getDuplicateFormValues();
      const response = await axios.post(`/api/routes/create?from=${apiId}`, { name });
      const newApiRouteId = response.data.id as string;
      router.push(`/projects/${project.id}/routes/${newApiRouteId}`);
    } catch(err) {
      console.log(err);
      toast({ status: "error", title: "Ah! An error occurred while duplicating, maybe try again?" });
    } finally {
      setDuplicateModal({ show: false, fromApiName: '' });
    }
  };

  const deleteApi = async (e, apiId: string, apiName: string) => {
    e.stopPropagation();
    if (deletingApi) return;
    setDeletingApi(apiId);
    
    const confirmed = await confirmDialog({
      title: `Delete ${apiName} API route`,
      description: `Deleting this API route will remove all configurations and immediately make its proxy URL unusable. This action is irreversible.`,
      btnConfirmTxt: 'Delete API route',
    });

    if (confirmed) {
      await axios.delete(`/api/routes/${apiId}`);
      router.replace(router.asPath, undefined, { scroll: false });
    }

    setDeletingApi('');
  };

  const openDuplicateApiModal = async (e, api: ApiRoute) => {
    e.stopPropagation();
    setDuplicateFormValue('apiId', api.id);
    setDuplicateFormValue('name', `${api.name} Duplicate`);
    setDuplicateModal({ show: true, fromApiName: api.name });
  };

  return (
    <ProjectSecrets.Provider value={project.Secret}>
      <Box {...props}>
        <Flex justifyContent="space-between">
          <SectionHeading heading="🔌 API routes">
            API endpoints that are configured with Diode.
          </SectionHeading>
          <Button onClick={() => setShowCreationModal(true)} colorScheme="green" bg="green.400" rightIcon={<PlusIcon width="16" />}>
            New API route
          </Button>
        </Flex>
        <Box mt="8">
          {project.ApiRoute.map((api) => (
            <Box
              position="relative" 
              border="1px"
              borderColor="gray.200"
              bg="white"
              _first={{ roundedTop: "md" }}
              _notFirst={{ mt: -1 }}
              _last={{ roundedBottom: "md" }}
              _hover={{ bg: "gray.50" }}
            >
              <Flex alignItems="center" py="3" px="6">
                <ApiMethodTag method={api.method} />
                <Text ml="4" fontWeight="600">
                  <NextLink href={`/projects/${project.id}/routes/${api.id}`}>
                    <Box position="absolute" inset="0" />
                    {api.name}
                  </NextLink>
                </Text>
                <Text ml="8" color="gray.500" fontSize="sm" textOverflow="ellipsis" maxW="400" whiteSpace="nowrap" overflowX="hidden">
                  {decodeURI(api.apiUrl)}
                </Text>
                <Menu id="route-options" isLazy>
                  <MenuButton
                    as={IconButton}
                    aria-label={`${api.name} options`}
                    icon={<DotsVerticalIcon width="16" />}
                    variant="ghost"
                    size="sm"
                    ml="auto"
                    isLoading={api.id === deletingApi}
                    onClick={e => e.stopPropagation()}
                  />
                  <MenuList minWidth="auto" fontSize="sm">
                    <MenuItem icon={<DuplicateIcon width="16" />} onClick={(e) => openDuplicateApiModal(e, api)}>
                      Duplicate
                    </MenuItem>
                    <MenuItem icon={<TrashIcon width="16" />} color="red.500" onClick={(e) => deleteApi(e, api.id, api.name)}>
                      Delete
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Flex>
            </Box>
          ))}
          {!project.ApiRoute.length && (
            <Box mt="16" color="gray.600" fontWeight="600" textAlign="center">
              No API routes configured. Let&apos;s add one! 🔌
            </Box>
          )}
        </Box>
      </Box>

      <Modal size="lg" isOpen={showCreationModal} onClose={() => setShowCreationModal(false)}>
        <ModalOverlay />
        <ModalContent p="2" pt="4">
          <ModalHeader>
            <Heading fontFamily="heading" fontWeight="700" fontSize="2xl">New API route</Heading>
            <Text fontSize="small" color="gray.500" fontWeight="500" mt="2">Let&apos;s get building! 💪</Text>
          </ModalHeader>
          <form onSubmit={handleNewFormSubmit(createApi)}>
            <ModalBody py={8}>
              <FormControl>
                <FormLabel>API route name</FormLabel>
                <Input placeholder="Notion API" required {...registerNewForm("name")} />
              </FormControl>
              <Flex mt="8">
                <FormControl width="120px">
                  <FormLabel>Method</FormLabel>
                  <Select roundedRight="none" required {...registerNewForm("method")}>
                    {Object.keys(ApiMethod).map((method) => <option key={method} value={method}>{method}</option>)}
                  </Select>
                </FormControl>
                <FormControl width="calc(100% - 120px)">
                  <FormLabel>Endpoint URL</FormLabel>
                  <SecretInput
                    inputProps={{ type: "url", placeholder: "https://api.example.com", required: true }}
                    containerProps={{ ml: "-1px", roundedLeft: "none" }}
                    control={control}
                    name="apiUrl"
                  />
                </FormControl>
              </Flex>
            </ModalBody>

            <ModalFooter>
              <Button type="submit" colorScheme="green" bg="green.400" width="full" isLoading={isCreatingApi}>
                Create &amp; configure API route ›
              </Button>
            </ModalFooter>
          </form>

          <ModalCloseButton />
        </ModalContent>
      </Modal>

      <Modal size="lg" isOpen={duplicateModal.show} onClose={() => setDuplicateModal({ show: false, fromApiName: '' })}>
        <ModalOverlay />
        <ModalContent p="2" pt="4">
          <ModalHeader>
            <Heading fontFamily="heading" fontWeight="700" fontSize="2xl">Duplicate &quot;{duplicateModal.fromApiName}&quot; API route</Heading>
            <Text fontSize="small" color="gray.500" fontWeight="500" mt="2">
              This action will create a new API route with the same configuration as &quot;{duplicateModal.fromApiName}&quot; API route.
            </Text>
          </ModalHeader>
          <form onSubmit={handleDuplicateFormSubmit(duplicateApi)}>
            <ModalBody py={8}>
              <FormControl>
                <FormLabel>API route name</FormLabel>
                <Input placeholder="Notion API" required {...registerDuplicateForm("name")} />
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button type="submit" colorScheme="green" bg="green.400" width="full" isLoading={isDuplicatingApi}>
                Duplicate &amp; configure API route ›
              </Button>
            </ModalFooter>
          </form>
          <ModalCloseButton />
        </ModalContent>
      </Modal>
    </ProjectSecrets.Provider>
  );
}
