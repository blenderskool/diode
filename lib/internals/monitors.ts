import axios from 'axios';
import Cron from 'croner';
import { render } from 'micromustache';
import { ExpandedHeaders, QueryParams } from 'pages/api/v1/types';
import { performance } from 'perf_hooks';
import prisma from '../prisma';
import { decryptSecrets } from './secrets';
import { addQueryParams, mergeHeaders, substituteSecrets } from './utils';

const jobs = new Map<string, Cron>();

/**
 * Starts a monitoring Cron job
 * @param id Monitor ID
 * @param frequency How often should the monitor run, in cron format
 */
export function startMonitor(id: string, frequency: string) {
  stopMonitor(id);
  const job = Cron(frequency, createMonitorHandler(id));
  jobs.set(id, job);
}

/**
 * Stops a monitoring job if it exists
 * @param id Monitor ID
 */
export function stopMonitor(id: string) {
  const job = jobs.get(id);
  if (job) {
    job.stop();
    jobs.delete(id);
  }
}

/**
 * Starts all the monitoring jobs stored in the database
 */
export async function startAllMonitors() {
  const monitors = await prisma.monitor.findMany();

  for (const monitor of monitors) {
    startMonitor(monitor.id, monitor.frequency);
  }
}

/**
 * Creates a new monitor handler function that can be passed to the Cron job.
 * @param id Monitor ID
 * @returns A function that triggers a check of the origin API endpoint.
 */
const createMonitorHandler = (id: string) => async () => {
  const monitor = await prisma.monitor.findUnique({
    include: {
      project: {
        select: {
          id: true,
          Secret: true,
        },
      },
    },
    where: {
      id,
    },
  });

  if (!monitor) return;

  // Decrypt the project secrets
  const secrets = decryptSecrets(monitor.project.Secret);
  const apiUrl = encodeURI(render(decodeURI(monitor.apiUrl), secrets));

  // Request preparation
  const requestUrl = new URL(apiUrl);
  // Add query params
  addQueryParams(
    requestUrl,
    substituteSecrets(monitor.queryParams as QueryParams, secrets)
  );

  // Add request headers
  const requestHeaders = mergeHeaders(
    substituteSecrets(monitor.headers as ExpandedHeaders, secrets)
  );

  const startTime = performance.now();
  const response = await axios.get(requestUrl.toString(), {
    headers: requestHeaders,
    validateStatus: () => true,
  });
  const responseTime = performance.now() - startTime;

  await prisma.monitorLog.create({
    data: {
      monitorId: id,
      status: response.status,
      responseTime,
    },
  });
};
