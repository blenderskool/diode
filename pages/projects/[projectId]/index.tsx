import { ApiMethod, Project as ProjectType } from '@prisma/client';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Flex, Heading, Divider } from '@chakra-ui/react';
import axios from 'axios';

import ApiStats from '../../../components/ApiStats';
import BackLink from '../../../components/BackLink';
import Apis from './_apis';
import Secrets from './_secrets';
import DangerZone from './_danger-zone';
import prisma from '../../../lib/prisma';

type ProjectData = (ProjectType & {
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

type ProjectStats = {
  totalSuccesses: number;
  totalFails: number;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.params.projectId as string;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      ApiRoute: {
        select: {
          id: true,
          name: true,
          apiUrl: true,
          method: true,
          successes: true,
          fails: true,
        },
      },
      Secret: {
        select: {
          name: true,
        }
      },
    },
  });

  const stats: ProjectStats = {
    totalSuccesses: project.ApiRoute.reduce((sum, api) => sum + api.successes, 0),
    totalFails: project.ApiRoute.reduce((sum, api) => sum + api.fails, 0),
  };

  return { props: { project, stats } };
}

type Props = {
  project: ProjectData,
  stats: ProjectStats,
};

export default function Project({ project, stats }: Props) {
  const router = useRouter();
  const projectName = project.name + (!project.name.endsWith('project') ? ' project' : '');

  const deleteProject = async () => {
    await axios.delete(`/api/projects/${project.id}`);
    router.replace('/projects');
  };

  return (
    <>
      <Head>
        <title>{projectName} | Diode 🔌</title>
      </Head>
      <BackLink>All Projects</BackLink>
      <Flex justifyContent="space-between">
        <Heading mt="4" as="h1" size="lg" fontWeight="800">{projectName}</Heading>
        <ApiStats successes={stats.totalSuccesses} fails={stats.totalFails} />
      </Flex>

      <Apis mt="20" project={project} />

      <Divider my="20" />

      <Secrets project={project} />

      <Divider my="20" />

      <DangerZone mb="32" onDelete={deleteProject} buttonText="Delete project">
        Deleting a project removes all the API routes and Secrets associated with it.
        <br />
        This action is irreverisble.
      </DangerZone>
    </>
  );
}
