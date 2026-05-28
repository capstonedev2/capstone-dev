import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

let cachedPrisma: PrismaClient | undefined;

function getPoolMax() {
  const parsed = Number.parseInt(process.env.DATABASE_POOL_MAX ?? '', 10);

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return process.env.NODE_ENV === 'production' ? 5 : 3;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.');
  }

  const adapter = new PrismaPg({
    connectionString,
    max: getPoolMax(),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') ? false : {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true'
    }
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  });
}

function getPrismaClient() {
  const existingClient = globalForPrisma.prisma ?? cachedPrisma;

  if (existingClient) {
    return existingClient;
  }

  const client = createPrismaClient();
  cachedPrisma = client;

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
  set(_target, property, value) {
    return Reflect.set(getPrismaClient(), property, value);
  },
  has(_target, property) {
    return property in getPrismaClient();
  },
  ownKeys() {
    return Reflect.ownKeys(getPrismaClient());
  },
  getOwnPropertyDescriptor(_target, property) {
    return Reflect.getOwnPropertyDescriptor(getPrismaClient(), property);
  }
}) as PrismaClient;
