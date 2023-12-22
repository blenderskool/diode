import { Divider, Flex, Heading } from '@chakra-ui/react';
import type { ApiMethod, Project as ProjectType } from '@prisma/client';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { Apis, DangerZone, Secrets } from '@/components/sections';
import { ApiStats, BackLink, confirmDialog } from '@/components/ui';
import prisma from '@/lib/prisma';

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

  if (project === null) {
    return {
      redirect: {
        permanent: false,
        destination: "/404"
      },
    };
  }

  const stats: ProjectStats = {
    totalSuccesses: !project ? 0 : project.ApiRoute.reduce((sum, api) => sum + api.successes, 0),
    totalFails: !project ? 0 : project.ApiRoute.reduce((sum, api) => sum + api.fails, 0),
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
    const confirmed = await confirmDialog({
      title: `Delete ${projectName}`,
      description: `Deleting this project will also delete all the API routes and Secrets in this project. This action is irreversible.`,
      btnConfirmTxt: 'Delete project',
    });

    if (confirmed) {
      await axios.delete(`/api/projects/${project.id}`);
      router.replace('/projects');
    }
  };

  return (
    <>
      <Head>
        <title>{`${projectName} | Diode 🔌`}</title>
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
