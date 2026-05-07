import type { PrismaClient } from '@prisma/client';

/**
 * Prisma client holder for RBAC functions
 *
 * Apps must call setPrismaClient() during initialization to provide
 * the Prisma client instance for RBAC permission checks.
 */

let prismaClient: PrismaClient | null = null;

/**
 * Set the Prisma client to be used by RBAC functions
 * This should be called once during app initialization
 */
export function setPrismaClient(client: PrismaClient): void {
  prismaClient = client;
}

/**
 * Get the Prisma client instance
 * Throws an error if not initialized
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    throw new Error(
      'Prisma client not initialized. Call setPrismaClient() during app initialization.'
    );
  }
  return prismaClient;
}
