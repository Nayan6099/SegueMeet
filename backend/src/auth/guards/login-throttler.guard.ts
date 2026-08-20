import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip = req.ips?.length ? req.ips[0] : req.ip;
    // Normalize email if present in the body
    const email = req.body?.email?.trim().toLowerCase();
    
    if (email) {
      return `${ip}-${email}`;
    }
    
    return ip;
  }
}
