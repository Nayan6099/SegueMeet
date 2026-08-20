import { Controller, Get, Post, Header, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { BoardPackService } from './board-pack.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

/**
 * BoardPackController — all endpoints are JWT-protected.
 *
 * Provides two endpoints per meeting:
 *  - JSON data endpoint (useful for frontend rendering or debugging)
 *  - PDF download endpoint (generates and streams a complete PDF board pack)
 *
 * Tenant isolation, data aggregation, and PDF generation are entirely
 * delegated to BoardPackService.
 */
@UseGuards(JwtAuthGuard)
@Controller('meetings/:meetingId/board-pack')
export class BoardPackController {
  constructor(private readonly boardPackService: BoardPackService) {}

  /**
   * GET /meetings/:meetingId/board-pack
   *
   * Returns the complete board-pack data as JSON.
   * Useful for frontend rendering or API consumers that build their own layout.
   */
  @Get()
  getBoardPackData(
    @Param('meetingId') meetingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.boardPackService.getBoardPackData(meetingId, user);
  }

  /**
   * GET /meetings/:meetingId/board-pack/pdf
   *
   * Generates a PDF board pack and streams it as an attachment.
   * Returns Content-Type: application/pdf.
   * The StreamableFile returned by the service is automatically handled
   * by NestJS — no @Res() needed.
   */
  @Get('pdf')
  @Header('Content-Type', 'application/pdf')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  generatePdf(
    @Param('meetingId') meetingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.boardPackService.generatePdf(meetingId, user);
  }

  /**
   * POST /meetings/:meetingId/board-pack/publish
   *
   * Generates a PDF board pack, uploads it to Cloudinary, and saves it in the DB.
   */
  @Post('publish')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  publishBoardPack(
    @Param('meetingId') meetingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.boardPackService.publishBoardPack(meetingId, user);
  }
}
