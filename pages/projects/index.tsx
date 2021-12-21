import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Link,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { Project } from '@prisma/client';
import axios from 'axios';

import { HelpText } from '@/components';
import prisma from '@/lib/prisma';

type ProjectData = (Project & {
  _count: {
    ApiRoute: number;
    Secret: number;
  };
});

export const getServerSideProps: GetServerSideProps = async () => {
  const projects: ProjectData[] = await prisma.project.findMany({
    include: {
      _count: {
        select: {
          ApiRoute: true,
          Secret: true,
        }
      }
    }
  });

  return { props: { projects } };
}

type Props = {
  projects: ProjectData[],
};

export default function Projects({ projects }: Props) {
  const [isNewProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const router = useRouter();

  const createProject = async (e) => {
    e.preventDefault();
    if (creatingProject) return;

    setCreatingProject(true);
    const response = await axios.post(`/api/projects/create?name=${newProjectName}`, { name: newProjectName });
    const project: Project = response.data;
    setCreatingProject(false);

    router.push(`/projects/${project.id}`);
  };

  return (
    <>
      <Head>
        <title>Projects | Diode 🔌</title>
      </Head>
      <Flex justifyContent="space-between">
        <Heading as="h1" size="lg" fontWeight="800">Projects</Heading>
        <Button colorScheme="green" bg="green.400" rightIcon={<AddIcon w="3" h="3" />} onClick={() => setNewProjectOpen(true)}>
          New Project
        </Button>
      </Flex>
      <HelpText mt="4">
        Projects are used to group related API endpoints.
        <br />
        Every project has a set of Secrets which are consumed by APIs in that project.
      </HelpText>
      <Grid mt="16" gap="4" templateColumns="repeat(3, 1fr)">
        {projects.map((project) => (
          <NextLink href={`/projects/${project.id}`} key={project.id}>
            <Link
              rounded="base"
              border="solid"
              borderWidth="1px"
              borderColor="gray.300"
              px="8"
              py="4"
              _hover={{
                textDecoration: "none",
                shadow: "md",
                transform: "scale(1.01)",
              }}
            >
              <Text fontWeight="700" fontSize="xl" fontFamily="heading">
                {project.name}
              </Text>
              <Text color="gray.500" fontSize="smaller" fontWeight="medium" mt="2">
                {project._count.ApiRoute} API routes &bull; {project._count.Secret} Secrets
              </Text>
            </Link>
          </NextLink>
        ))}
      </Grid>
      {projects.length === 0 && (
        <Box mt="32" color="gray.600" fontWeight="600" textAlign="center">
          You have not created any project. Let&apos;s create one!
        </Box>
      )}

      <Modal isOpen={isNewProjectOpen} onClose={() => setNewProjectOpen(false)}>
        <ModalOverlay />
        <ModalContent p="2" pt="4">
          <ModalHeader>
            <Heading fontFamily="heading" fontWeight="700" fontSize="2xl">New project</Heading>
            <Text fontSize="small" color="gray.500" fontWeight="500" mt="2">Let&apos;s get building! 💪</Text>
          </ModalHeader>

          <form onSubmit={createProject}>
            <ModalBody py={8}>
              <FormControl>
                <FormLabel>Project name</FormLabel>
                <Input placeholder="Exotic APIs" required value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button type="submit" colorScheme="green" bg="green.400" width="full" isLoading={creatingProject}>
                Create project ›
              </Button>
            </ModalFooter>
          </form>

          <ModalCloseButton />
        </ModalContent>
      </Modal>

    </>
  );
}
