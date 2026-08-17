import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * DatabaseModule provides the PrismaService to the entire application.
 *
 * Marked @Global so that feature modules do not need to import it explicitly —
 * they just inject PrismaService directly.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
