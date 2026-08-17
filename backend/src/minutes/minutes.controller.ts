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
import { MinutesService } from './minutes.service';
import { CreateMinutesDto } from './dto/create-minutes.dto';
import { UpdateMinutesDto } from './dto/update-minutes.dto';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

/**
 * MinutesController — all endpoints are JWT-protected.
 *
 * Routes follow the established project convention:
 *   Nested under parent: /meetings/:meetingId/minutes
 *   Direct resource:     /minutes/:minutesId
 *   Nested under parent: /minutes/:minutesId/action-items
 *   Direct resource:     /action-items/:actionItemId
 *
 * Business logic and tenant isolation are delegated entirely to MinutesService.
 */
@UseGuards(JwtAuthGuard)
@Controller()
export class MinutesController {
  constructor(private readonly minutesService: MinutesService) {}

  // ─────────────────────────────────────────────
  // MINUTES
  // ─────────────────────────────────────────────

  /**
   * POST /meetings/:meetingId/minutes
   */
  @Post('meetings/:meetingId/minutes')
  @HttpCode(HttpStatus.CREATED)
  createMinutes(
    @Param('meetingId') meetingId: string,
    @Body() dto: CreateMinutesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.minutesService.createMinutes(meetingId, dto, user);
  }

  /**
   * GET /meetings/:meetingId/minutes
   */
  @Get('meetings/:meetingId/minutes')
  getMinutes(
    @Param('meetingId') meetingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.minutesService.getMinutes(meetingId, user);
  }

  /**
   * PATCH /minutes/:minutesId
   */
  @Patch('minutes/:minutesId')
  updateMinutes(
    @Param('minutesId') minutesId: string,
    @Body() dto: UpdateMinutesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.minutesService.updateMinutes(minutesId, dto, user);
  }

  /**
   * DELETE /minutes/:minutesId
   * Cascade-deletes all MinutesActionItem records automatically.
   */
  @Delete('minutes/:minutesId')
  @HttpCode(HttpStatus.OK)
  deleteMinutes(
    @Param('minutesId') minutesId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.minutesService.deleteMinutes(minutesId, user);
  }

  // ─────────────────────────────────────────────
  // ACTION ITEMS
  // ─────────────────────────────────────────────

  /**
   * POST /minutes/:minutesId/action-items
   */
  @Post('minutes/:minutesId/action-items')
  @HttpCode(HttpStatus.CREATED)
  createActionItem(
    @Param('minutesId') minutesId: string,
    @Body() dto: CreateActionItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.minutesService.createActionItem(minutesId, dto, user);
  }

  /**
   * PATCH /action-items/:actionItemId
   */
  @Patch('action-items/:actionItemId')
  updateActionItem(
    @Param('actionItemId') actionItemId: string,
    @Body() dto: UpdateActionItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.minutesService.updateActionItem(actionItemId, dto, user);
  }

  /**
   * DELETE /action-items/:actionItemId
   */
  @Delete('action-items/:actionItemId')
  @HttpCode(HttpStatus.OK)
  deleteActionItem(
    @Param('actionItemId') actionItemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.minutesService.deleteActionItem(actionItemId, user);
  }
}
