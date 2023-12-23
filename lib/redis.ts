import Redis, { Redis as RedisType } from 'ioredis';
import RedisMock from 'ioredis-mock';

let client: RedisType;
if (process.env.NEXT_PUBLIC_MOCK_DEPLOYMENT === 'true') {
  client = new RedisMock();
} else {
  client = new Redis(process.env.REDIS_URL);
}

export default client;
