import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { CommitteesService } from './committees.service';
import { CreateCommitteeDto } from './dto/create-committee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('committees')
export class CommitteesController {
  constructor(private readonly committeesService: CommitteesService) {}

  @Get()
  getCommittees(
    @Query('organisationId') organisationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!organisationId) {
      throw new BadRequestException('organisationId query parameter is required');
    }
    return this.committeesService.getCommittees(organisationId, user);
  }

  @Post()
  createCommittee(
    @Body() dto: CreateCommitteeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.committeesService.createCommittee(dto, user);
  }

  @Patch(':id')
  updateCommittee(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.committeesService.updateCommittee(id, body, user);
  }

  @Delete(':id')
  deleteCommittee(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.committeesService.deleteCommittee(id, user);
  }

  @Post(':id/members')
  addCommitteeMember(
    @Param('id') id: string,
    @Body() body: { userId: string; role: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!body.userId || !body.role) {
      throw new BadRequestException('userId and role are required');
    }
    return this.committeesService.addCommitteeMember(id, body.userId, body.role, user);
  }

  @Patch(':id/members/:userId')
  updateCommitteeMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { role: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!body.role) {
      throw new BadRequestException('role is required');
    }
    return this.committeesService.updateCommitteeMemberRole(id, userId, body.role, user);
  }

  @Delete(':id/members/:userId')
  removeCommitteeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.committeesService.removeCommitteeMember(id, userId, user);
  }
}
