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
import { ApiMethod, ApiRoute, Project, Restriction } from '@prisma/client';
import { useEffect, useReducer, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import copy from 'copy-to-clipboard';

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
import { ExpandedHeaders, QueryParams } from '../../../api/v1/_types';


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

type ApiConfigState = {
  method: string;
  apiUrl: string;
  queryParams: [string, string][];
  headers: [string, string][];

  restriction: Restriction | null;
  allowedIps: string;
  allowedOrigins: string;

  rateLimiting: RateLimitingOptions;
  caching: CachingOptions;
};

const applyQueryParams = (apiUrl: string, query: QueryParams) => {
  const url = new URL(apiUrl);
  const searchParams = new URLSearchParams(query);

  return decodeURI(url.origin + url.pathname) + (query.length ? '?' + searchParams : '');
};

const apiConfigReducer = (state: ApiConfigState, action: { type: string, value?: any }) => {
  switch (action.type) {
    case "SET_METHOD":
      return { ...state, method: action.value };
    case "SET_APIURL": {
      try {
        const url = new URL(action.value);
        return { ...state, apiUrl: action.value, queryParams: [...url.searchParams] };
      } catch {
        return { ...state, apiUrl: action.value };
      }
    }
    case "ADD_QUERY_PARAM":
      return {
        ...state,
        queryParams: [...state.queryParams, ['', '']],
      };
    case "REMOVE_QUERY_PARAM": {
      const queryParams: QueryParams = state.queryParams.filter((_, i) => i !== action.value)
      try {
        return { ...state, queryParams, apiUrl: applyQueryParams(state.apiUrl, queryParams) };
      } catch {
        return { ...state, queryParams };
      }
    }
    case "SET_QUERY_PARAM": {
      const queryParams: QueryParams = state.queryParams.map((query, i) => (
        i === action.value.idx ? [action.value.key, action.value.value] : [...query]
      ));
      try {
        return { ...state, queryParams, apiUrl: applyQueryParams(state.apiUrl, queryParams) };
      } catch {
        return { ...state, queryParams };
      }
    }
    case "ADD_HEADER":
      return {
        ...state,
        headers: [...state.headers, ['', '']],
      };
    case "REMOVE_HEADER":
      return { ...state, headers: state.headers.filter((_, i) => i !== action.value) };
    case "SET_HEADER":
      return {
        ...state,
        headers: state.headers.map((query, i) => (
          i === action.value.idx ? [action.value.key, action.value.value] : [...query]
        )),
      };

    case "SET_RESTRICTION_TYPE":
      return { ...state, restriction: action.value };
    case "SET_ALLOWED_ORIGINS":
      return { ...state, allowedOrigins: action.value };
    case "SET_ALLOWED_IPS":
      return { ...state, allowedIps: action.value };

    case "ENABLE_RATE_LIMITING":
      return { ...state, rateLimiting: { windowSize: 60, maxRequests: 20 } };
    case "DISABLE_RATE_LIMITING":
      return { ...state, rateLimiting: {} };
    case "SET_RATE_LIMITING_WINDOW":
      return { ...state, rateLimiting: { ...state.rateLimiting, windowSize: parseInt(action.value) } };
    case "SET_RATE_LIMITING_MAX_REQS":
      return { ...state, rateLimiting: { ...state.rateLimiting, maxRequests: parseInt(action.value) } };

    case "ENABLE_CACHING":
      return { ...state, caching: { duration: 60 } };
    case "DISABLE_CACHING":
      return { ...state, caching: {} };
    case "SET_CACHING_DURATION":
      return { ...state, caching: { ...state.caching, duration: parseInt(action.value) } };
  }
}

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
  apiRoute: ApiRoute & {
    project: Project & {
      Secret: {
        name: string;
      }[];
    };
  };
};

export default function ApiRoutePage({ apiRoute }: Props) {
  const [config, dispatch] = useReducer(apiConfigReducer, {
    method: apiRoute.method,
    apiUrl: applyQueryParams(apiRoute.apiUrl, apiRoute.queryParams as QueryParams),
    queryParams: apiRoute.queryParams as QueryParams,
    headers: apiRoute.headers as ExpandedHeaders,
    restriction: apiRoute.restriction,
    allowedIps: apiRoute.allowedIps.join(', '),
    allowedOrigins: apiRoute.allowedOrigins.join(', '),
    rateLimiting: apiRoute.rateLimiting as RateLimitingOptions,
    caching: apiRoute.caching as CachingOptions,
  });
  const router = useRouter();
  const toast = useToast();
  const [proxyUrl, setProxyUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setProxyUrl(`${window.location.origin}/api/v1/${apiRoute.id}`);
  }, [setProxyUrl, apiRoute.id]);

  const isRestrictionsEnabled = config.restriction !== null;
  const isRateLimitingEnabled = Object.keys(config.rateLimiting).length !== 0;
  const isCachingEnabled = Object.keys(config.caching).length !== 0;

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
      setIsUpdating(true);
      await axios.post(`/api/routes/${apiRoute.id}`, {
        ...config,
        allowedIps: config.allowedIps.split(/,\s*/),
        allowedOrigins: config.allowedOrigins.split(/,\s*/),
      });
      router.replace(router.asPath, undefined, { scroll: false });
      toast({ status: "success", title: "Changes saved successfully" });
    } catch(err) {
      console.log(err);
      toast({ status: "error", title: "Ah! There was an error, maybe try again" });
    } finally {
      setIsUpdating(false);
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

      <form onSubmit={updateRoute}>
        {/* Api configuration section */}
        <Box>
          <SectionHeading heading="⚙️ Configuration" />

          <Flex mt="8">
            <FormControl width="150px">
              <FormLabel>Method</FormLabel>
              <Select
                value={config.method}
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
                value={config.apiUrl}
                onChange={(e) => dispatch({ type: "SET_APIURL", value: e.target.value })}
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
                      dispatch({ type: "ADD_QUERY_PARAM" });
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
                  config.queryParams.map(([key, value], i) => (
                    <QueryParamInput
                      key={i}
                      keyVal={key}
                      valueVal={value}
                      onKeyChange={(e) => dispatch({
                        type: "SET_QUERY_PARAM",
                        value: { idx: i, key: e.target.value, value }
                      })}
                      onValueChange={(e) => dispatch({
                        type: "SET_QUERY_PARAM",
                        value: { idx: i, key, value: e.target.value }
                      })}
                      onRemove={() => dispatch({ type: "REMOVE_QUERY_PARAM", value: i })}
                    />
                  ))
                }
                {config.queryParams.length === 0 && <Box textAlign="center" my="12" color="gray.600" fontWeight="600">No query parameters added</Box>}
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
                      dispatch({ type: "ADD_HEADER" });
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
                  config.headers.map(([key, value], i) => (
                    <QueryParamInput
                      key={i}
                      keyVal={key}
                      valueVal={value}
                      onKeyChange={(e) => dispatch({
                        type: "SET_HEADER",
                        value: { idx: i, key: e.target.value, value }
                      })}
                      onValueChange={(e) => dispatch({
                        type: "SET_HEADER",
                        value: { idx: i, key, value: e.target.value }
                      })}
                      onRemove={() => dispatch({ type: "REMOVE_HEADER", value: i })}
                    />
                  ))
                }
                {config.headers.length === 0 && <Box textAlign="center" my="12" color="gray.600" fontWeight="600">No headers added</Box>}
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
                🌏 {config.apiUrl}
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
            <Switch
              colorScheme="green"
              size="lg"
              isChecked={!!config.restriction}
              onChange={(e) => dispatch({ type: "SET_RESTRICTION_TYPE", value: e.target.checked ? Restriction.HTTP : null })}
            />
          </FormControl>
          {isRestrictionsEnabled && (
            <Box width="95%" ml="auto">
              <FormControl display="flex" py="4" justifyContent="space-between" alignItems="center">
                <FormLabel>Restriction type</FormLabel>
                <RadioGroup value={config.restriction} onChange={(value) => dispatch({ type: "SET_RESTRICTION_TYPE", value })} experimental_spaceX="6" colorScheme="green">
                  <Radio isRequired value="HTTP">Domains</Radio>
                  <Radio isRequired value="IP">IP addresses</Radio>
                </RadioGroup>
              </FormControl>
              {
                config.restriction === Restriction.IP && (
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
                      value={config.allowedIps}
                      onChange={(e) => dispatch({ type: "SET_ALLOWED_IPS", value: e.target.value })}
                    />
                  </FormControl>
                )
              }
              {
                config.restriction === Restriction.HTTP && (
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
                      value={config.allowedOrigins}
                      onChange={(e) => dispatch({ type: "SET_ALLOWED_ORIGINS", value: e.target.value })}
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
            <Switch
              colorScheme="green"
              size="lg"
              isChecked={isRateLimitingEnabled}
              onChange={(e) => dispatch({ type: e.target.checked ?  "ENABLE_RATE_LIMITING" : "DISABLE_RATE_LIMITING" })}
            />
          </FormControl>
          {
            isRateLimitingEnabled && (
              <Box width="95%" ml="auto">
                <FormControl display="flex" py="4" justifyContent="space-between" alignItems="center">
                  <FormLabel>Max number of requests</FormLabel>
                  <Input
                    width="20%"
                    type="number"
                    required
                    value={(config.rateLimiting as any).maxRequests}
                    onChange={(e) => dispatch({ type: "SET_RATE_LIMITING_MAX_REQS", value: e.target.value })}
                  />
                </FormControl>
                <FormControl display="flex" py="4" justifyContent="space-between" alignItems="center">
                  <FormLabel>Window size(in seconds)</FormLabel>
                  <Input
                    width="20%"
                    type="number"
                    required
                    value={(config.rateLimiting as any).windowSize}
                    onChange={(e) => dispatch({ type: "SET_RATE_LIMITING_WINDOW", value: e.target.value })}
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
            <Switch
              colorScheme="green"
              size="lg"
              isChecked={isCachingEnabled}
              onChange={(e) => dispatch({ type: e.target.checked ?  "ENABLE_CACHING" : "DISABLE_CACHING" })}
            />
          </FormControl>
          {
            isCachingEnabled && (
              <Box width="95%" ml="auto">
                <FormControl display="flex" py="4" justifyContent="space-between" alignItems="center">
                  <FormLabel>Cache duration(in seconds)</FormLabel>
                  <Input
                    width="20%"
                    type="number"
                    required
                    value={(config.caching as any).duration}
                    onChange={(e) => dispatch({ type: "SET_CACHING_DURATION", value: e.target.value })}
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
          isLoading={isUpdating}
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
