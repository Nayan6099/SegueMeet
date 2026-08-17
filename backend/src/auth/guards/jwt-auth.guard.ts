import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard — apply to any route that requires a valid JWT Bearer token.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('protected-route')
 *   handler(@CurrentUser() user: AuthenticatedUser) { ... }
 *
 * Returns 401 Unauthorized when the token is missing, expired, or invalid.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
