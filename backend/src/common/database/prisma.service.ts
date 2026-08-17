import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService wraps the singleton PrismaClient instance.
 *
 * - Connects on module initialisation and disconnects on module destroy,
 *   so the lifecycle is managed cleanly by the NestJS DI container.
 * - Exported from the DatabaseModule so that any feature module can inject it.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
