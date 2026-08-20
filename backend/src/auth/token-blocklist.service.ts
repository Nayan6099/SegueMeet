import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TokenBlocklistService {
  private readonly logger = new Logger(TokenBlocklistService.name);
  
  // Stores jti -> expiration timestamp (in seconds)
  private readonly blocklist = new Map<string, number>();

  /**
   * Adds a token's JTI to the blocklist until it naturally expires.
   * @param jti JWT ID
   * @param exp Expiration timestamp (in seconds since epoch)
   */
  revokeToken(jti: string, exp: number): void {
    if (!jti || !exp) {
      this.logger.warn('Attempted to revoke token without jti or exp');
      return;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    // Only store if it hasn't already expired
    if (exp > nowSeconds) {
      this.blocklist.set(jti, exp);
      this.logger.debug(`Token ${jti} revoked until ${exp}`);
    }
  }

  /**
   * Checks if a token is in the blocklist.
   * @param jti JWT ID
   * @returns true if the token is revoked, false otherwise
   */
  isTokenRevoked(jti: string): boolean {
    if (!jti) {
      return false; // If no JTI is present, we can't check the blocklist
    }
    
    const exp = this.blocklist.get(jti);
    if (!exp) {
      return false;
    }

    // Double check it hasn't expired (cleanup routine might not have run yet)
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (exp <= nowSeconds) {
      this.blocklist.delete(jti);
      return false;
    }

    return true;
  }

  /**
   * Periodically cleans up expired tokens from the blocklist to prevent memory leaks.
   * Runs every hour.
   */
  @Cron(CronExpression.EVERY_HOUR)
  cleanupExpiredTokens(): void {
    const nowSeconds = Math.floor(Date.now() / 1000);
    let removedCount = 0;

    for (const [jti, exp] of this.blocklist.entries()) {
      if (exp <= nowSeconds) {
        this.blocklist.delete(jti);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.debug(`Cleaned up ${removedCount} expired tokens from blocklist`);
    }
  }
}
