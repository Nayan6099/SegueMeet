import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { OrganisationsService } from '../../organisations/organisations.service';

/**
 * Global guard that ensures the authenticated user belongs to the organisation (tenant)
 * for any route that includes an `organisationId` param.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly organisationsService: OrganisationsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.id) {
      throw new ForbiddenException('Unauthenticated');
    }
    const organisationId = request.params?.organisationId || request.params?.id;
    if (!organisationId) {
      return true; // Not a tenant‑scoped route
    }
    await this.organisationsService.requireMembership(organisationId, user.id);
    return true;
  }
}
