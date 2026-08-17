import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentUser() — extracts the authenticated user from the request.
 *
 * Usage: place after @UseGuards(JwtAuthGuard) on any route handler parameter.
 * Returns the user object set by JwtStrategy.validate().
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: unknown }>();
    return request.user;
  },
);
