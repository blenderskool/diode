import { GetServerSideProps } from 'next';
import {
  Flex,
  Button,
  Heading,
  Divider,
  Box,
  Code,
  Text,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Select,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Radio,
  RadioGroup,
  Tag,
  useToast,
} from '@chakra-ui/react';
import { CheckIcon, CopyIcon } from '@chakra-ui/icons';
import { ApiMethod, Project } from '@prisma/client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import copy from 'copy-to-clipboard';
import { useFieldArray, useForm } from 'react-hook-form';

import SectionHeading from '../../../../components/SectionHeading';
import HelpText from '../../../../components/HelpText';
import ApiStats from '../../../../components/ApiStats';
import BackLink from '../../../../components/BackLink';
import QueryParamInput from '../../../../components/QueryParamInput';
import Secrets from '../_secrets';
import prisma from '../../../../lib/prisma';
import { RateLimitingOptions } from '../../../../lib/middlewares/rate-limit';
import { CachingOptions } from '../../../../lib/middlewares/cache';
import DangerZone from '../_danger-zone';
import { ApiRouteWithMiddlewares, QueryParams } from '../../../api/v1/_types';
import { RestrictionOptions } from '../../../../lib/middlewares/restriction';


const MiddlewareCard = ({ ...props }) => (
  <Box
    ml="10"
    bg="white"
    display="inline-block"
    shadow="base"
    rounded="md"
    px="5"
    py="3"
    border="1px"
    borderColor="gray.200"
    fontSize="sm"
    fontWeight="500"
    color="gray.700"
    {...props}
  />
);

type FormData = {
  method: string;
  apiUrl: string;
  queryParams: { name: string, value: string }[];
  headers: { name: string, value: string }[];

  restriction: Omit<RestrictionOptions, 'allowedIps' | 'allowedOrigins'> & {
    allowedIps: string;
    allowedOrigins: string;
  };

  rateLimiting: RateLimitingOptions;
  caching: CachingOptions;
};

const applyQueryParams = (apiUrl: string, query: QueryParams) => {
  const url = new URL(apiUrl);
  const searchParams = new URLSearchParams(query);

  return decodeURI(url.origin + url.pathname) + (query.length ? '?' + searchParams : '');
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const routeId = params.routeId as string;

  const apiRoute = await prisma.apiRoute.findUnique({
    where: { id: routeId },
    include: {
      project: {
        include: {
          Secret: {
            select: {
              name: true,
            }
          },
        }
      }
    }
  });

  if (apiRoute === null) {
    return {
      redirect: {
        permanent: false,
        destination: "/404"
      },
    };
  }

  return { props: { apiRoute } };
};

type Props = {
  apiRoute: ApiRouteWithMiddlewares & {
    project: Project & {
      Secret: {
        name: string;
      }[];
    };
  };
};

export default function ApiRoutePage({ apiRoute }: Props) {
  const { register, handleSubmit, getValues, watch, control, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      apiUrl: apiRoute.apiUrl,
      method: apiRoute.method,
      queryParams: [],
      headers: [],
      restriction: {
        enabled: apiRoute.restriction.enabled ?? false,
        type: apiRoute.restriction.type ?? 'HTTP',
        allowedIps: apiRoute.restriction.allowedIps?.join?.(', ') ?? '',
        allowedOrigins: apiRoute.restriction.allowedOrigins?.join?.(', ') ?? '',
      },
      rateLimiting: {
        enabled: apiRoute.rateLimiting.enabled ?? false,
        maxRequests: apiRoute.rateLimiting.maxRequests ?? 20,
        windowSize: apiRoute.rateLimiting.windowSize ?? 60,
      },
      caching: {
        enabled: apiRoute.caching.enabled ?? false,
        duration: apiRoute.caching.duration ?? 120,
      },
    }
  });
  const { append: appendHeader, remove: removeHeader, fields: headerFields } = useFieldArray({
    control,
    name: 'headers',
  });
  const { append: appendQueryParam, remove: removeQueryParam, fields: queryParamFields } = useFieldArray({
    control,
    name: 'queryParams',
  });

  const router = useRouter();
  const toast = useToast();
  const [proxyUrl, setProxyUrl] = useState('');

  const syncUrlAndQueryParams = useCallback((_, { name, type }) => {
    if (type !== 'change') return;

    const [apiUrl, queryParams] = getValues(['apiUrl', 'queryParams']);

    try {
      if (name === 'apiUrl') {
        const url = new URL(apiUrl);
        setValue('queryParams', [...url.searchParams].map(([name, value]) => ({ name, value })));
      } else if (name.startsWith('queryParams')) {
        const qp: QueryParams = queryParams.map(({ name, value }) => [name, value]);
        setValue('apiUrl', applyQueryParams(apiUrl, qp));
      }
    } catch(err) {
      // Ignore error as further updates might resolve correctly
      console.log(err);
    }
  }, [setValue, getValues]);

  useEffect(() => {
    setProxyUrl(`${window.location.origin}/api/v1/${apiRoute.id}`);
  }, [setProxyUrl, apiRoute.id]);

  useEffect(() => {
    return watch(syncUrlAndQueryParams).unsubscribe;
  }, [watch, syncUrlAndQueryParams]);

  const [isRestrictionsEnabled, isRateLimitingEnabled, isCachingEnabled] = watch(['restriction.enabled', 'rateLimiting.enabled', 'caching.enabled']);

  const copyProxyUrl = () => {
    try {
      copy(proxyUrl);
      toast({ status: "success", title: "Copied proxy URL" });
    } catch {
      toast({ status: "error", title: "Ah! There was an error, maybe try again" });
    }
  };

  const updateRoute = async (e) => {
    e.preventDefault();
    try {
      const updatedApiRoute = getValues();
      await axios.post(`/api/routes/${apiRoute.id}`, {
        ...updatedApiRoute,
        queryParams: updatedApiRoute.queryParams.map(header => [header.name, header.value]),
        headers: updatedApiRoute.headers.map(header => [header.name, header.value]),
        restriction: {
          ...updatedApiRoute.restriction,
          allowedIps: updatedApiRoute.restriction.allowedIps.split(/,\s*/),
          allowedOrigins: updatedApiRoute.restriction.allowedOrigins.split(/,\s*/),
        },
      });
      router.replace(router.asPath, undefined, { scroll: false });
      toast({ status: "success", title: "Changes saved successfully" });
    } catch(err) {
      console.log(err);
      toast({ status: "error", title: "Ah! There was an error, maybe try again" });
    }
  };

  const deleteRoute = async () => {
    await axios.delete(`/api/routes/${apiRoute.id}`);
    router.replace(`/projects/${apiRoute.project.id}`);
  };

  return (
    <>
      <Head>
        <title>{apiRoute.name} | Diode 🔌</title>
      </Head>
      <BackLink>Project details</BackLink>
      <Flex justifyContent="space-between">
        <Heading mt="4" as="h1" size="lg" fontWeight="800">
          {apiRoute.name}
        </Heading>
        <ApiStats successes={apiRoute.successes} fails={apiRoute.fails} avgResponseTime={apiRoute.avgResponseMs} />
      </Flex>

      {/* Proxy endpoint section */}
      <Box mt="20">
        <SectionHeading heading="🪄 Proxy endpoint">
          Diode will forward all the requests made to the below URL to the origin endpoint.
          <br />
          <strong>No API keys are required</strong> and the request and response <strong>structure is same</strong> as that of the origin endpoint.
        </SectionHeading>
        <Flex mt="8" alignItems="center">
          <Tag size="lg">{apiRoute.method}</Tag>
          <Text fontWeight="600" ml="4">{proxyUrl}</Text>
          <Button onClick={copyProxyUrl} size="sm" ml="auto" rightIcon={<CopyIcon />} colorScheme="green" bg="green.400">
            Copy URL
          </Button>
        </Flex>
      </Box>

      <Divider my="20" />

      <form onSubmit={handleSubmit(updateRoute)}>
        {/* Api configuration section */}
        <Box>
          <SectionHeading heading="⚙️ Configuration" />

          <Flex mt="8">
            <FormControl width="150px">
              <FormLabel>Method</FormLabel>
              <Select roundedRight="none" required {...register('method')}>
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
                {...register('apiUrl')}
              />
            </FormControl>
          </Flex>

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
                  You can refer to secrets in value field using <Code>{"{{ SECRET_NAME }}"}</Code>
                </HelpText>
                {
                  queryParamFields.map((field, idx) => (
                    <QueryParamInput
                      key={field.id}
                      keyProps={register(`queryParams.${idx}.name`)}
                      valueProps={register(`queryParams.${idx}.value`)}
                      onRemove={() => {
                        removeQueryParam(idx);
                        // Explicit call to watch handler because fieldarray events are not captured by react-hook-form
                        syncUrlAndQueryParams({}, { name: 'queryParams', type: 'change' });
                      }}
                    />
                  ))
                }
                {getValues('queryParams').length === 0 && <Box textAlign="center" my="12" color="gray.600" fontWeight="600">No query parameters added</Box>}
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
                  You can refer to secrets in value field using <Code>{"{{ SECRET_NAME }}"}</Code>
                </HelpText>
                {
                  headerFields.map((field, idx) => (
                    <QueryParamInput
                      key={field.id}
                      keyProps={register(`headers.${idx}.name`)}
                      valueProps={register(`headers.${idx}.value`)}
                      onRemove={() => removeHeader(idx)}
                    />
                  ))
                }
                {getValues('headers').length === 0 && <Box textAlign="center" my="12" color="gray.600" fontWeight="600">No headers added</Box>}
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Box>

        <Divider my="20" />

        {/* Request flow diagram */}
        <Box>
          <SectionHeading heading="🧭 Request flow">
            This flow shows all the middlewares applied on calls before a request gets made to the origin endpoint.
          </SectionHeading>
          <Flex position="relative" alignItems="center" mt="10">
            {/* Request Line */}
            <Box position="absolute" h="1px" bg="gray.300" width="100%" />

            <Flex position="relative" zIndex="10" alignItems="center" width="100%">
              {isRestrictionsEnabled && <MiddlewareCard>🚫 Restrictions</MiddlewareCard>}
              {isRateLimitingEnabled && <MiddlewareCard>⏱️ Rate Limiting</MiddlewareCard>}
              {isCachingEnabled && <MiddlewareCard>📌 Caching</MiddlewareCard>}
              
              {/* Arrow */}
              <Box as="span" ml="auto" mr="1px" borderWidth="0 1px 1px 0" p="4px" borderColor="gray.400" display="inline-block" transform="rotate(-45deg)" />

              <MiddlewareCard ml="0" textOverflow="ellipsis" maxWidth="200px" whiteSpace="nowrap" overflowX="hidden">
                🌏 {watch('apiUrl')}
              </MiddlewareCard>
            </Flex>
          </Flex>
        </Box>

        <Divider my="20" />

        {/* Middlewares section */}
        <Box>
          <SectionHeading heading="📦 Middlewares">
            Middlewares allow you to add additional functionality before the request reaches the origin endpoint.
          </SectionHeading>
          <FormControl mt="8" display="flex" py="4" justifyContent="space-between" alignItems="center">
            <FormLabel>
              🚫 Restrictions middleware
              <HelpText mt="2">
                Restricts access to the API route only to some specific domains or IP addresses.
              </HelpText>
            </FormLabel>
            <Switch colorScheme="green" size="lg" {...register('restriction.enabled')} />
          </FormControl>
          {isRestrictionsEnabled && (
            <Box width="95%" ml="auto">
              <FormControl display="flex" py="4" justifyContent="space-between" alignItems="center">
                <FormLabel>Restriction type</FormLabel>
                <RadioGroup experimental_spaceX="6" colorScheme="green">
                  <Radio isRequired value="HTTP" {...register('restriction.type')}>Domains</Radio>
                  <Radio isRequired value="IP" {...register('restriction.type')}>IP addresses</Radio>
                </RadioGroup>
              </FormControl>
              {
                watch('restriction.type') === 'IP' && (
                  <FormControl display="flex" py="4" justifyContent="space-between" alignItems="center">
                    <FormLabel>
                      Whitelist IP addresses
                      <HelpText mt="2">
                        Separate IP addresses by comma.
                        <br/>
                        Wildcards, CIDR subnets supported.
                      </HelpText>
                    </FormLabel>
                    <Input
                      width="50%"
                      placeholder="127.0.0.1, 127.0.0.1/24, 10.1.*.*"
                      {...register('restriction.allowedIps')}
                    />
                  </FormControl>
                )
              }
              {
                watch('restriction.type') === 'HTTP' && (
                  <FormControl display="flex" py="4" justifyContent="space-between" alignItems="center">
                    <FormLabel>
                      Whitelist domains
                      <HelpText mt="2">
                        Domains should be fully qualified with protocol.
                        <br/>
                        Wildcards not supported currently.
                      </HelpText>
                    </FormLabel>
                    <Input
                      width="50%"
                      placeholder="https://example.com, http://demo.example.com"
                      {...register('restriction.allowedOrigins')}
                    />
                  </FormControl>
                )
              }
            </Box>
          )}

          <FormControl mt="8" display="flex" py="4" justifyContent="space-between" alignItems="center">
            <FormLabel>
              ⏱️ Rate Limiting middleware
              <HelpText mt="2">
                Limits the number of calls every IP address can make within a time interval.
              </HelpText>
            </FormLabel>
            <Switch colorScheme="green" size="lg" {...register('rateLimiting.enabled')} />
          </FormControl>
          {
            isRateLimitingEnabled && (
              <Box width="95%" ml="auto">
                <FormControl display="flex" py="4" justifyContent="space-between" alignItems="center">
                  <FormLabel>Max number of requests</FormLabel>
                  <Input
                    type="number"
                    width="20%"
                    required
                    {...register('rateLimiting.maxRequests')}
                  />
                </FormControl>
                <FormControl display="flex" py="4" justifyContent="space-between" alignItems="center">
                  <FormLabel>Window size(in seconds)</FormLabel>
                  <Input
                    type="number"
                    width="20%"
                    required
                    {...register('rateLimiting.windowSize')}
                  />
                </FormControl>
              </Box>
            )
          }

          <FormControl mt="8" display="flex" py="4" justifyContent="space-between" alignItems="center">
            <FormLabel>
              📌 Caching middleware
              <HelpText mt="2">
                Caches the result from origin endpoint and returns it for further calls within a time interval.
              </HelpText>
            </FormLabel>
            <Switch colorScheme="green" size="lg" {...register('caching.enabled')} />
          </FormControl>
          {
            isCachingEnabled && (
              <Box width="95%" ml="auto">
                <FormControl display="flex" py="4" justifyContent="space-between" alignItems="center">
                  <FormLabel>Cache duration(in seconds)</FormLabel>
                  <Input
                    type="number"
                    width="20%"
                    required
                    {...register('caching.duration')}
                  />
                </FormControl>
              </Box>
            )
          }
        </Box>

        {/* Save changes button */}
        <Button
          type="submit"
          position="fixed"
          right="16"
          bottom="8"
          colorScheme="green"
          bg="green.400"
          shadow="lg"
          rightIcon={<CheckIcon w="3" h="3" />}
          isLoading={isSubmitting}
        >
          Save changes
        </Button>
      </form>

      <Divider my="20" />

      {/* Secrets section */}
      <Secrets project={apiRoute.project}  />

      <Divider my="20" />

      {/* Deletion section */}
      <DangerZone mb="32" onDelete={deleteRoute} buttonText="Delete API route">
        Deleting an API route immediately disables the above proxy endpoint.
        <br />
        This action is irreverisble.
      </DangerZone>
    </>
  );
}
