import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InterestsService } from './interests.service';
import { CreateInterestDto } from './dto/create-interest.dto';
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
}
