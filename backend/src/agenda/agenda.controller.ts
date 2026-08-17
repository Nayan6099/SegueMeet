import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { CreateAgendaSectionDto } from './dto/create-agenda-section.dto';
import { UpdateAgendaSectionDto } from './dto/update-agenda-section.dto';
import { CreateAgendaItemDto } from './dto/create-agenda-item.dto';
import { UpdateAgendaItemDto } from './dto/update-agenda-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller() // Routes are specific per method due to nesting
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  // ─────────────────────────────────────────────
  // SECTIONS
  // ─────────────────────────────────────────────

  @Post('meetings/:meetingId/agenda/sections')
  @HttpCode(HttpStatus.CREATED)
  createSection(
    @Param('meetingId') meetingId: string,
    @Body() dto: CreateAgendaSectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agendaService.createSection(meetingId, dto, user);
  }

  @Get('meetings/:meetingId/agenda')
  getAgenda(
    @Param('meetingId') meetingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agendaService.getAgenda(meetingId, user);
  }

  @Patch('agenda/sections/:sectionId')
  updateSection(
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateAgendaSectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agendaService.updateSection(sectionId, dto, user);
  }

  @Delete('agenda/sections/:sectionId')
  @HttpCode(HttpStatus.OK)
  deleteSection(
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agendaService.deleteSection(sectionId, user);
  }

  // ─────────────────────────────────────────────
  // ITEMS
  // ─────────────────────────────────────────────

  @Post('agenda/sections/:sectionId/items')
  @HttpCode(HttpStatus.CREATED)
  createItem(
    @Param('sectionId') sectionId: string,
    @Body() dto: CreateAgendaItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agendaService.createItem(sectionId, dto, user);
  }

  @Patch('agenda/items/:itemId')
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateAgendaItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agendaService.updateItem(itemId, dto, user);
  }

  @Delete('agenda/items/:itemId')
  @HttpCode(HttpStatus.OK)
  deleteItem(
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agendaService.deleteItem(itemId, user);
  }
}
