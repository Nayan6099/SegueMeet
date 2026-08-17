import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { OrganisationsService } from './organisations.service';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { AddMemberDto } from './dto/add-member.dto';

/**
 * All routes in this controller require a valid JWT Bearer token.
 * Tenant isolation (membership verification) is enforced in the service layer.
 */
@UseGuards(JwtAuthGuard)
@Controller('organisations')
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  // ─────────────────────────────────────────────
  // ORGANISATION
  // ─────────────────────────────────────────────

  /**
   * GET /organisations/:id
   *
   * Returns organisation details. Caller must be a member.
   */
  @Get(':id')
  findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organisationsService.findById(id, user);
  }

  /**
   * PATCH /organisations/:id
   *
   * Updates name and/or settings. Caller must be a BOARD_ADMIN.
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganisationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organisationsService.update(id, dto, user);
  }

  // ─────────────────────────────────────────────
  // MEMBERS
  // ─────────────────────────────────────────────

  /**
   * GET /organisations/:id/members
   *
   * Lists all members with their roles. Caller must be a member.
   */
  @Get(':id/members')
  listMembers(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organisationsService.listMembers(id, user);
  }

  /**
   * POST /organisations/:id/members
   *
   * Adds an existing user by email to the organisation.
   * Caller must be a BOARD_ADMIN.
   */
  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organisationsService.addMember(id, dto, user);
  }

  /**
   * DELETE /organisations/:id/members/:userId
   *
   * Removes a user's membership. Caller must be a BOARD_ADMIN.
   * Safety: cannot remove self; cannot remove last admin.
   * Only the membership record is deleted — the user account is preserved.
   */
  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organisationsService.removeMember(id, userId, user);
  }
}
