import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './auth/auth.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { MeetingsModule } from './meetings/meetings.module';
import { AuditModule } from './audit/audit.module';
import { AgendaModule } from './agenda/agenda.module';
import { MinutesModule } from './minutes/minutes.module';
import { DocumentsModule } from './documents/documents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BoardPackModule } from './board-pack/board-pack.module';

@Module({
  imports: [
    /**
     * ConfigModule reads .env (or process.env) and makes every value
     * available via ConfigService throughout the application.
     * isGlobal: true means no other module needs to import ConfigModule.
     */
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    /**
     * DatabaseModule is @Global and provides PrismaService to all modules
     * without requiring explicit imports.
     */
    DatabaseModule,

    /** Authentication — register, login, JWT strategy */
    AuthModule,

    /** Organisations — CRUD, member management, tenant isolation */
    OrganisationsModule,

    /** Meetings — CRUD, tenant-isolated meeting management */
    MeetingsModule,

    /** Audit — System audit logging */
    AuditModule,

    /** Agenda — Sections and Items management */
    AgendaModule,

    /** Minutes — Meeting minutes and action items */
    MinutesModule,

    /** Documents — Document metadata management */
    DocumentsModule,

    /** Notifications — User notification read/manage API */
    NotificationsModule,

    /** BoardPack — Meeting board pack JSON + PDF generation */
    BoardPackModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


