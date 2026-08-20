import { GlobalThrottlerGuard } from './global-throttler.guard';
import { ExecutionContext } from '@nestjs/common';

describe('GlobalThrottlerGuard', () => {
  let guard: GlobalThrottlerGuard;

  beforeEach(() => {
    // Mock the options and storage service for the guard
    const mockOptions = {};
    const mockStorageService = {};
    const mockReflector = {};
    // Need to cast to any since we are mocking
    guard = new GlobalThrottlerGuard(mockOptions as any, mockStorageService as any, mockReflector as any);
  });

  describe('getTracker', () => {
    it('should track authenticated users by user id', async () => {
      const mockReq = {
        user: { id: 'user-123' },
        ip: '192.168.1.1',
      };
      
      const tracker = await (guard as any).getTracker(mockReq);
      expect(tracker).toBe('user-123');
    });

    it('should track unauthenticated users by IP', async () => {
      const mockReq = {
        ips: ['10.0.0.1', '192.168.1.1'],
        ip: '192.168.1.1',
      };
      
      const tracker = await (guard as any).getTracker(mockReq);
      expect(tracker).toBe('10.0.0.1'); // Uses first proxy IP if available
    });

    it('should track login requests by IP + normalized email', async () => {
      const mockReq = {
        url: '/auth/login',
        ip: '127.0.0.1',
        body: { email: ' TEST@Example.com ' }
      };

      const tracker = await (guard as any).getTracker(mockReq);
      expect(tracker).toBe('127.0.0.1-test@example.com');
    });

    it('should fallback to IP for login without email', async () => {
      const mockReq = {
        url: '/auth/login',
        ip: '127.0.0.1',
        body: {}
      };

      const tracker = await (guard as any).getTracker(mockReq);
      expect(tracker).toBe('127.0.0.1');
    });
  });
});
