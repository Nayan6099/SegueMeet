import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InterestsService } from './interests.service';
import { CreateInterestDto } from './dto/create-interest.dto';
import { UpdateInterestDto } from './dto/update-interest.dto';
import { CreateMeetingConflictDto } from './dto/create-meeting-conflict.dto';
import { UpdateMeetingConflictDto } from './dto/update-meeting-conflict.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('interests')
export class InterestsController {
  constructor(private readonly interestsService: InterestsService) {}

  @Get()
  getInterests(
    @Query('organisationId') organisationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!organisationId) {
      throw new BadRequestException('organisationId query parameter is required');
    }
    return this.interestsService.getInterests(organisationId, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createInterest(
    @Body() dto: CreateInterestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.interestsService.createInterest(dto, user);
  }

  @Patch(':id')
  updateInterest(
    @Param('id') id: string,
    @Body() dto: UpdateInterestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.interestsService.updateInterest(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteInterest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.interestsService.deleteInterest(id, user);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('meetings/:meetingId/conflicts')
export class MeetingConflictsController {
  constructor(private readonly interestsService: InterestsService) {}

  @Get()
  getMeetingConflicts(
    @Param('meetingId') meetingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.interestsService.getMeetingConflicts(meetingId, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  declareMeetingConflict(
    @Param('meetingId') meetingId: string,
    @Body() dto: CreateMeetingConflictDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.interestsService.declareMeetingConflict(meetingId, dto, user);
  }

  @Patch(':conflictId')
  updateMeetingConflict(
    @Param('conflictId') conflictId: string,
    @Body() dto: UpdateMeetingConflictDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.interestsService.updateMeetingConflict(conflictId, dto, user);
  }
}
