import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class GlobalThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip = req.ips?.length ? req.ips[0] : req.ip;

    // Strict brute-force protection for login using IP + Email
    if (req.url === '/auth/login' || req.originalUrl === '/auth/login') {
      const email = req.body?.email?.trim().toLowerCase();
      if (email) {
        return `${ip}-${email}`;
      }
    }

    // If the request is authenticated, throttle by user ID
    if (req.user && req.user.id) {
      return req.user.id;
    }
    
    // Otherwise, throttle by IP
    return ip;
  }
}
