import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';
import { ICalCalendarMethod } from 'ical-generator';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let sendMailMock: jest.Mock;

  beforeEach(async () => {
    sendMailMock = jest.fn().mockResolvedValue({ messageId: 'test-id' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Calendar .ics generation', () => {
    const meeting = {
      id: 'meet-123',
      title: 'Board Meeting',
      date: '2026-08-14',
      startTime: '10:00',
      endTime: '12:00',
      location: 'Conference Room A',
      notes: 'Please read the board pack.',
      updatedAt: new Date('2026-08-10T10:00:00Z'),
    };

    it('should generate REQUEST ics and stable UID for invite', async () => {
      await service.sendMeetingInvite('test@example.com', meeting, 'Test Org', 'Alice');
      expect(sendMailMock).toHaveBeenCalledTimes(1);
      
      const args = sendMailMock.mock.calls[0][0];
      expect(args.icalEvent).toBeDefined();
      expect(args.icalEvent.method).toBe('request');
      
      const icsStr = args.icalEvent.content;
      expect(icsStr).toContain('METHOD:REQUEST');
      expect(icsStr).toContain('UID:meet-123'); // stable UID
      expect(icsStr).toContain('SEQUENCE:0');
      expect(icsStr).toContain('STATUS:CONFIRMED');
      // No timezone provided -> floating
      expect(icsStr).toContain('DTSTART:20260814T100000');
    });

    it('should generate IANA timezone output when timeZone is provided', async () => {
      const tzMeeting = { ...meeting, timeZone: 'Asia/Kolkata' };
      await service.sendMeetingInvite('test@example.com', tzMeeting, 'Test Org', 'Alice');
      const args = sendMailMock.mock.calls[0][0];
      const icsStr = args.icalEvent.content;
      expect(icsStr).toContain('DTSTART;TZID=Asia/Kolkata:20260814T100000');
      expect(args.html).toContain('Asia/Kolkata');
    });

    it('should generate REQUEST ics with incremented sequence for updates', async () => {
      await service.sendMeetingUpdate('test@example.com', meeting, 'Test Org', 'Alice');
      
      const args = sendMailMock.mock.calls[0][0];
      const icsStr = args.icalEvent.content;
      expect(icsStr).toContain('METHOD:REQUEST');
      expect(icsStr).toContain('UID:meet-123');
      const expectedSequence = Math.floor(meeting.updatedAt.getTime() / 1000);
      expect(icsStr).toContain(`SEQUENCE:${expectedSequence}`);
      expect(icsStr).toContain('STATUS:CONFIRMED');
    });

    it('should generate CANCEL ics for cancellations', async () => {
      await service.sendMeetingCancelled('test@example.com', meeting, 'Test Org', 'Alice');
      
      const args = sendMailMock.mock.calls[0][0];
      const icsStr = args.icalEvent.content;
      expect(icsStr).toContain('METHOD:CANCEL');
      expect(icsStr).toContain('UID:meet-123');
      expect(icsStr).toContain('STATUS:CANCELLED');
    });
  });
});
