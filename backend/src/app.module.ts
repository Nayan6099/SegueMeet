import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './auth/auth.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { MeetingsModule } from './meetings/meetings.module';
import { BoardPackModule } from './board-pack/board-pack.module';
import { AuditModule } from './audit/audit.module';
import { AgendaModule } from './agenda/agenda.module';
import { MinutesModule } from './minutes/minutes.module';
import { DocumentsModule } from './documents/documents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SearchModule } from './search/search.module';
import { DecisionsModule } from './decisions/decisions.module';
import { ResolutionsModule } from './resolutions/resolutions.module';
import { CommitteesModule } from './committees/committees.module';
import { AnnualPlanModule } from './annual-plan/annual-plan.module';
import { InterestsModule } from './interests/interests.module';

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

    /** BoardPack — Meeting board pack JSON + PDF generation */
    BoardPackModule,

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

    /** Search — Global search across meetings, documents, and people */
    SearchModule,

    /** Decisions — Central register of board decisions */
    DecisionsModule,

    /** Resolutions — Circular resolutions out-of-session */
    ResolutionsModule,

    /** Committees — Management of board committees */
    CommitteesModule,

    /** Annual Plan — Board's yearly agenda/work plan */
    AnnualPlanModule,

    /** Interests — Conflicts of interest register */
    InterestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
