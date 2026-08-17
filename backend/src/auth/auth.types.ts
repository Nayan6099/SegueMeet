/**
 * Shared auth types used across auth and feature modules.
 *
 * Kept in a dedicated file so that controllers/services can import the
 * interface with `import type` (required by isolatedModules + emitDecoratorMetadata).
 */

/** Shape of the JWT payload written at sign-time. */
export interface JwtPayload {
  /** Subject — the authenticated user's UUID */
  sub: string;
  email: string;
}

/**
 * The user object placed on req.user by JwtStrategy.validate().
 * Never includes passwordHash.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Prisma select that guarantees passwordHash is never returned. */
export const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} as const;
