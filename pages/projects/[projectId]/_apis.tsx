import { ApiMethod, Project } from '@prisma/client';
import NextLink from 'next/link';
import {
  Box,
  Flex,
  Heading,
  Text,
  Link,
  Tooltip,
  Button,
  IconButton,
  Tag,
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
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import axios from 'axios';

import SectionHeading from '../../../components/SectionHeading';
import SecretInput from '../../../components/SecretInput';
import ProjectSecrets from '../../../lib/contexts/ProjectSecrets';

export const getServerSideProps = () => ({ props: {} });

type Props = {
  project: (Project & {
    ApiRoute: {
      id: string;
      name: string;
      apiUrl: string;
      method: ApiMethod;
      successes: number;
      fails: number;
    }[];
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

export default function Apis({ project, ...props }: Props) {
  const { getValues, control, register, formState: { isSubmitting: isCreatingApi } } = useForm<NewApiFormData>({
    defaultValues: {
      name: '',
      method: ApiMethod.GET,
      apiUrl: '',
    },
  });
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [deletingApi, setDeletingApi] = useState('');
  const router = useRouter();
  const toast = useToast();

  const createApi = async (e) => {
    e.preventDefault();
    if (isCreatingApi) return;

    try {
      const response = await axios.post(`/api/routes/create`, {
        ...getValues(),
        projectId: project.id,
      });
      const newApiRouteId = response.data.id as string;
      router.push(`/projects/${project.id}/routes/${newApiRouteId}`);
    } catch(err) {
      console.log(err);
      toast({ status: "error", title: "Ah! An error occurred, maybe try again?" });
    } finally {
      setShowCreationModal(false);
    }
  };

  const deleteApi = async (e, apiId: string) => {
    e.stopPropagation();
    if (deletingApi) return;

    setDeletingApi(apiId);
    await axios.delete(`/api/routes/${apiId}`);
    setDeletingApi('');
    router.replace(router.asPath, undefined, { scroll: false });
  };

  return (
    <ProjectSecrets.Provider value={project.Secret}>
      <Box {...props}>
        <Flex justifyContent="space-between">
          <SectionHeading heading="🔌 API routes">
            API endpoints that are configured with Diode.
          </SectionHeading>
          <Button onClick={() => setShowCreationModal(true)} colorScheme="green" bg="green.400" rightIcon={<AddIcon w="3" h="3" />}>
            New API route
          </Button>
        </Flex>
        <Box mt="8">
          {project.ApiRoute.map((api) => (
            <NextLink href={`/projects/${project.id}/routes/${api.id}`} key={api.id}>
              <Link
                display="block"
                border="1px"
                borderColor="gray.200"
                bg="white"
                _first={{ roundedTop: "md" }}
                _notFirst={{ mt: -1 }}
                _last={{ roundedBottom: "md" }}
                _hover={{ textDecoration: "none", shadow: "md", transform: "scale(1.01)" }}
              >
                <Flex alignItems="center" py="3" px="6">
                  <Tag>{api.method}</Tag>
                  <Text ml="4" fontWeight="600">{api.name}</Text>
                  <Text ml="8" color="gray.500" fontSize="sm" textOverflow="ellipsis" maxW="400" whiteSpace="nowrap" overflowX="hidden">
                    {decodeURI(api.apiUrl)}
                  </Text>
                  <Tooltip label="Remove this API route" fontSize="xs">
                    <IconButton
                      icon={<DeleteIcon w={3} h={3} />}
                      aria-label="Remove"
                      size="sm"
                      colorScheme="gray"
                      ml="auto"
                      onClick={(e) => deleteApi(e, api.id)}
                      isLoading={api.id === deletingApi}
                    />
                  </Tooltip>
                </Flex>
              </Link>
            </NextLink>
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
          <form onSubmit={createApi}>
            <ModalBody py={8}>
              <FormControl>
                <FormLabel>API Name</FormLabel>
                <Input placeholder="Notion API" required {...register("name")} />
              </FormControl>
              <Flex mt="8">
                <FormControl width="120px">
                  <FormLabel>Method</FormLabel>
                  <Select roundedRight="none" required {...register("method")}>
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
    </ProjectSecrets.Provider>
  );
}
