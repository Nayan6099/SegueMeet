import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY || 're_dummy_key';
    this.resend = new Resend(apiKey);
  }

  async sendMeetingInvite(to: string, meetingTitle: string, meetingDate: string, meetingTime: string, videoLink?: string | null, location?: string | null) {
    try {
      let htmlContent = `
        <h1>You're invited to a meeting!</h1>
        <p><strong>Meeting:</strong> ${meetingTitle}</p>
        <p><strong>Date:</strong> ${meetingDate}</p>
        <p><strong>Time:</strong> ${meetingTime}</p>
      `;

      if (videoLink) {
        htmlContent += `<p><strong>Video Link:</strong> <a href="${videoLink}">${videoLink}</a></p>`;
      }
      
      if (location) {
        htmlContent += `<p><strong>Location:</strong> ${location}</p>`;
      }

      htmlContent += `<p>Please log in to SegueMeet to view the agenda and documents.</p>`;

      const { data, error } = await this.resend.emails.send({
        from: 'SegueMeet Support <onboarding@resend.dev>', // You should replace this with a verified domain
        to: [to],
        subject: `Meeting Invite: ${meetingTitle}`,
        html: htmlContent,
      });

      if (error) {
        this.logger.error(`Failed to send email to ${to} via Resend: ${error.message}`);
        return { success: false, error };
      }

      this.logger.log(`Meeting Invite Email Sent to ${to}! via Resend (ID: ${data?.id})`);
      return { success: true, messageId: data?.id };
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to} via Resend: ${error.message}`);
      return { success: false, error };
    }
  }
}
