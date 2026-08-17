import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Logs an audit event asynchronously. Never throws, even on failure.
   */
  async log(params: {
    organisationId: string;
    actorId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    payload?: object;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          organisationId: params.organisationId,
          actorId: params.actorId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          payload: params.payload ? (params.payload as any) : null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit log for action ${params.action} on ${params.entityType} ${params.entityId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
