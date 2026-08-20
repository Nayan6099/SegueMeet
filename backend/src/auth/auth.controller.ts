import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ExtractJwt } from 'passport-jwt';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * POST /auth/register
   *
   * Creates a new user account and a new organisation.
   * The user becomes BOARD_ADMIN of the created organisation.
   * Returns an access token and safe user/organisation info.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /auth/login
   *
   * Validates credentials, returns a JWT access token.
   * Uses constant-time bcrypt comparison to prevent timing attacks.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }



  /**
   * POST /auth/logout
   *
   * Revokes the current token via the blocklist.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: Request) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req as any);
    if (token) {
      const decoded = this.jwtService.decode(token) as any;
      if (decoded && decoded.jti && decoded.exp) {
        return this.authService.logout(decoded.jti, decoded.exp);
      }
    }
    return this.authService.logout();
  }

  /**
   * GET /auth/me
   *
   * Returns the authenticated user's profile including their
   * organisation memberships and roles.
   * Requires a valid JWT Bearer token.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user);
  }

  /**
   * PATCH /auth/me
   *
   * Updates the authenticated user's profile.
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }
}
