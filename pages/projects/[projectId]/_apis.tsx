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
import { useReducer, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

import SectionHeading from '../../../components/SectionHeading';

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

type NewApiState = {
  name: string;
  method: string;
  apiUrl: string;
  loading: boolean;
  showCreationModal: boolean;
};

const newApiReducer = (state: NewApiState, action: { type: string, value: any }) => {
  switch(action.type) {
    case "SET_NAME":
      return { ...state, name: action.value };
    case "SET_METHOD":
      return { ...state, method: action.value };
    case "SET_APIURL":
      return { ...state, apiUrl: action.value };
    case "SET_LOADING":
      return { ...state, loading: action.value };
    case "SET_CREATION_MODAL":
      return { ...state, showCreationModal: action.value };
  }
};

export default function Apis({ project, ...props }: Props) {
  const [state, dispatch] = useReducer(newApiReducer, {
    name: '',
    method: ApiMethod.GET,
    apiUrl: '',
    loading: false,
    showCreationModal: false,
  });
  const [deletingApi, setDeletingApi] = useState('');
  const router = useRouter();
  const toast = useToast();

  const createApi = async (e) => {
    e.preventDefault();
    if (state.loading) return;

    try {
      dispatch({ type: "SET_LOADING", value: true });
      const response = await axios.post(`/api/routes/create`, {
        name: state.name,
        method: state.method,
        apiUrl: state.apiUrl,
        projectId: project.id,
      });
      const newApiRouteId = response.data.id as string;
      router.push(`/projects/${project.id}/routes/${newApiRouteId}`);
    } catch(err) {
      console.log(err);
      toast({ status: "error", title: "Ah! An error occurred, maybe try again?" });
    } finally {
      dispatch({ type: "SET_LOADING", value: false });
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
    <>
      <Box {...props}>
        <Flex justifyContent="space-between">
          <SectionHeading heading="🔌 API routes">
            API endpoints that are configured with Diode.
          </SectionHeading>
          <Button onClick={() => dispatch({ type: 'SET_CREATION_MODAL', value: true })} colorScheme="green" bg="green.400" rightIcon={<AddIcon w="3" h="3" />}>
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

      <Modal size="lg" isOpen={state.showCreationModal} onClose={() => dispatch({ type: 'SET_CREATION_MODAL', value: false })}>
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
                <Input
                  value={state.name}
                  placeholder="Notion API"
                  required
                  onChange={(e) => dispatch({ type: "SET_NAME", value: e.target.value })}
                />
              </FormControl>
              <Flex mt="8">
                <FormControl width="150px">
                  <FormLabel>Method</FormLabel>
                  <Select
                    value={state.method}
                    onChange={(e) => dispatch({ type: "SET_METHOD", value: e.target.value })} 
                    roundedRight="none"
                    required
                  >
                    {Object.keys(ApiMethod).map((method) => <option key={method} value={method}>{method}</option>)}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Endpoint URL</FormLabel>
                  <Input
                    type="url"
                    placeholder="https://api.example.com"
                    ml="-1px"
                    roundedLeft="none"
                    required
                    value={state.apiUrl}
                    onChange={(e) => dispatch({ type: "SET_APIURL", value: e.target.value })}
                  />
                </FormControl>
              </Flex>
            </ModalBody>

            <ModalFooter>
              <Button type="submit" colorScheme="green" bg="green.400" width="full" isLoading={state.loading}>
                Create &amp; configure API route ›
              </Button>
            </ModalFooter>
          </form>

          <ModalCloseButton />
        </ModalContent>
      </Modal>
    </>
  );
}
