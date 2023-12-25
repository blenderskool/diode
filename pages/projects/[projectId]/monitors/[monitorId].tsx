import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Code,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  useToast,
} from '@chakra-ui/react';
import { CheckIcon } from '@heroicons/react/outline';
import { Monitor, Project } from '@prisma/client';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useFieldArray, useForm } from 'react-hook-form';

import { Secrets } from '@/components/sections';
import {
  BackLink,
  HelpText,
  QueryParamInput,
  SecretInput,
  SectionHeading,
} from '@/components/ui';
import ProjectSecrets from '@/lib/contexts/ProjectSecrets';
import { useSyncUrlAndParams } from '@/lib/hooks/use-sync-url-and-params';
import { addQueryParams } from '@/lib/internals/utils';
import prisma from '@/lib/prisma';
import { ExpandedHeaders, QueryParams } from '../../../api/v1/types';

type FormData = {
  description: string;
  apiUrl: string;
  queryParams: { name: string; value: string }[];
  headers: { name: string; value: string }[];
  frequency: string;
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const monitorId = params.monitorId as string;

  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
    include: {
      project: {
        include: {
          Secret: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (monitor === null) {
    return {
      redirect: {
        permanent: false,
        destination: '/404',
      },
    };
  }

  return { props: { monitor } };
};

type Props = {
  monitor: Monitor & {
    project: Project & {
      Secret: {
        name: string;
      }[];
    };
  };
};

export default function MonitorPage({ monitor }: Props) {
  const {
    register,
    handleSubmit,
    getValues,
    watch,
    control,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      apiUrl: addQueryParams(
        monitor.apiUrl,
        monitor.queryParams as QueryParams
      ),
      queryParams:
        (monitor.queryParams as QueryParams).map(([name, value]) => ({
          name,
          value,
        })) ?? [],
      headers:
        (monitor.headers as ExpandedHeaders).map(([name, value]) => ({
          name,
          value,
        })) ?? [],
      description: monitor.description,
      frequency: monitor.frequency,
    },
  });
  const {
    append: appendHeader,
    remove: removeHeader,
    fields: headerFields,
  } = useFieldArray({
    control,
    name: 'headers',
  });
  const {
    append: appendQueryParam,
    remove: removeQueryParam,
    fields: queryParamFields,
  } = useFieldArray({
    control,
    name: 'queryParams',
  });

  const router = useRouter();
  const toast = useToast();

  const syncUrlAndQueryParams = useSyncUrlAndParams({
    getValues,
    setValue,
    watch,
  });

  const updateRoute = async (e) => {
    try {
      const updatedApiRoute = getValues();
      await axios.post(`/api/monitors/${monitor.id}`, {
        ...updatedApiRoute,
        queryParams: updatedApiRoute.queryParams.map(({ name, value }) => [
          name,
          value,
        ]),
        headers: updatedApiRoute.headers.map(({ name, value }) => [
          name,
          value,
        ]),
      });
      router.replace(router.asPath, undefined, { scroll: false });
      toast({ status: 'success', title: 'Changes saved successfully' });
    } catch (err) {
      console.log(err);
      toast({
        status: 'error',
        title: 'Ah! There was an error, maybe try again',
      });
    }
  };

  return (
    <ProjectSecrets.Provider value={monitor.project.Secret}>
      <Head>
        <title>{`${monitor.name} | Diode 🔌`}</title>
      </Head>
      <BackLink>Project details</BackLink>
      <Flex justifyContent="space-between">
        <Heading mt="4" as="h1" size="lg" fontWeight="800">
          {monitor.name}
        </Heading>
      </Flex>

      <form onSubmit={handleSubmit(updateRoute)}>
        {/* Api configuration section */}
        <Box mt="20">
          <SectionHeading heading="⚙️ Configuration" />

          <FormControl mt="8">
            <FormLabel>Origin endpoint URL</FormLabel>
            <SecretInput
              name="apiUrl"
              control={control}
              inputProps={{
                placeholder: 'https://api.example.com',
                type: 'url',
                required: true,
              }}
            />
          </FormControl>

          <Accordion mt="8" allowMultiple>
            <AccordionItem>
              <AccordionButton as="div" type="button">
                <Flex width="full" alignItems="center">
                  <Text fontWeight="500">Query parameters</Text>
                  <Button
                    type="button"
                    size="sm"
                    ml="auto"
                    mr="2"
                    colorScheme="green"
                    bg="green.400"
                    onClick={(e) => {
                      e.stopPropagation();
                      appendQueryParam({ name: '', value: '' });
                    }}
                  >
                    Add
                  </Button>
                  <AccordionIcon />
                </Flex>
              </AccordionButton>
              <AccordionPanel>
                <HelpText mb="4">
                  You can refer to secrets in value field using{' '}
                  <Code>{'{{ SECRET_NAME }}'}</Code>
                </HelpText>
                {queryParamFields.map((field, idx) => (
                  <QueryParamInput
                    key={field.id}
                    keyProps={register(`queryParams.${idx}.name`)}
                    valueProps={{ name: `queryParams.${idx}.value`, control }}
                    onRemove={() => {
                      removeQueryParam(idx);
                      // Explicit call to watch handler because fieldarray events are not captured by react-hook-form
                      syncUrlAndQueryParams(
                        {},
                        { name: 'queryParams', type: 'change' }
                      );
                    }}
                  />
                ))}
                {getValues('queryParams').length === 0 && (
                  <Box
                    textAlign="center"
                    my="12"
                    color="gray.600"
                    fontWeight="600"
                  >
                    No query parameters added
                  </Box>
                )}
              </AccordionPanel>
            </AccordionItem>
            <AccordionItem>
              <AccordionButton as="div" type="button">
                <Flex width="full" alignItems="center">
                  <Text fontWeight="500">Request headers</Text>
                  <Button
                    type="button"
                    size="sm"
                    ml="auto"
                    mr="2"
                    colorScheme="green"
                    bg="green.400"
                    onClick={(e) => {
                      e.stopPropagation();
                      appendHeader({ name: '', value: '' });
                    }}
                  >
                    Add
                  </Button>
                  <AccordionIcon />
                </Flex>
              </AccordionButton>
              <AccordionPanel>
                <HelpText mb="4">
                  You can refer to secrets in value field using{' '}
                  <Code>{'{{ SECRET_NAME }}'}</Code>
                </HelpText>
                {headerFields.map((field, idx) => (
                  <QueryParamInput
                    key={field.id}
                    keyProps={register(`headers.${idx}.name`)}
                    valueProps={{ name: `headers.${idx}.value`, control }}
                    onRemove={() => removeHeader(idx)}
                  />
                ))}
                {getValues('headers').length === 0 && (
                  <Box
                    textAlign="center"
                    my="12"
                    color="gray.600"
                    fontWeight="600"
                  >
                    No headers added
                  </Box>
                )}
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Box>

        <FormControl
          mt="8"
          display="flex"
          py="4"
          justifyContent="space-between"
          alignItems="center"
        >
          <FormLabel>
            ⏰ Frequency
            <HelpText mt="2">
              How often should Diode check the endpoint?
            </HelpText>
          </FormLabel>
          <Input w="50%" isRequired {...register('frequency')} />
        </FormControl>

        {/* Save changes button */}
        <Button
          type="submit"
          position="fixed"
          right="16"
          bottom="8"
          colorScheme="green"
          bg="green.400"
          shadow="lg"
          rightIcon={<CheckIcon width="16" />}
          isLoading={isSubmitting}
        >
          Save changes
        </Button>
      </form>

      <Divider my="20" />

      {/* Secrets section */}
      <Secrets project={monitor.project} mb="32" />
    </ProjectSecrets.Provider>
  );
}
