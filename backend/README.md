# SegueMeet Backend

## 1. Project Overview
SegueMeet is a robust meeting management backend designed around a multi-tenant organisation model. It provides RESTful API endpoints to manage the complete lifecycle of board and executive meetings—from agenda planning and document attachments to minute-taking, action items, and board pack PDF generation.

## 2. Tech Stack
- **Framework**: NestJS (v11)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma Client (v6)
- **Authentication**: JWT (Passport/Bcrypt)
- **PDF Generation**: PDFKit

## 3. Current Status
The backend has completed the following phases:
- **Phase 1: Foundation** (NestJS, Prisma, PostgreSQL schema)
- **Phase 2: Auth & Organisations** (JWT registration/login, Tenant Isolation)
- **Phase 3: Meetings** (CRUD, Role-based auth)
- **Phase 4: Agenda** (Sections and Items management)
- **Phase 5: Minutes** (Meeting minutes and Action Items)
- **Phase 6: Documents** (Document metadata management)
- **Phase 7: Board Pack / PDF Generation** (JSON data aggregation + PDF assembly)
- **Phase 8: Notifications** (Read/manage API for user notifications)
- **Phase 9: Audit Logging & Hardening** (System audit logging on key mutations, environment hardening)

## 4. Implemented Endpoints

### Auth Module (`/auth`)
- `POST /register` - Create a user and organisation (User becomes BOARD_ADMIN)
- `POST /login` - Authenticate and receive a JWT
- `POST /logout` - Stateless client-side logout
- `GET /me` - Get current user profile and org memberships

### Organisations Module (`/organisations`)
- `GET /:id` - Get organisation details
- `PATCH /:id` - Update organisation
- `GET /:id/members` - List organisation members
- `POST /:id/members` - Add a member to the organisation
- `DELETE /:id/members/:userId` - Remove a member

### Meetings Module (`/meetings`)
- `POST /` - Create a meeting
- `GET /` - List meetings (query filters supported)
- `GET /:id` - Get a meeting by ID
- `PATCH /:id` - Update a meeting
- `DELETE /:id` - Delete a meeting

### Agenda Module
- `POST /meetings/:meetingId/agenda/sections` - Create a section
- `GET /meetings/:meetingId/agenda` - Get the full agenda
- `PATCH /agenda/sections/:sectionId` - Update a section
- `DELETE /agenda/sections/:sectionId` - Delete a section
- `POST /agenda/sections/:sectionId/items` - Create an item
- `PATCH /agenda/items/:itemId` - Update an item
- `DELETE /agenda/items/:itemId` - Delete an item

### Minutes Module
- `POST /meetings/:meetingId/minutes` - Create minutes
- `GET /meetings/:meetingId/minutes` - Get minutes
- `PATCH /minutes/:minutesId` - Update minutes
- `DELETE /minutes/:minutesId` - Delete minutes
- `POST /minutes/:minutesId/action-items` - Create an action item
- `PATCH /action-items/:actionItemId` - Update an action item
- `DELETE /action-items/:actionItemId` - Delete an action item

### Documents Module (`/documents`)
- `POST /` - Create document metadata
- `GET /` - List documents
- `GET /:id` - Get document by ID
- `PATCH /:id` - Update document metadata
- `DELETE /:id` - Delete document metadata

### Notifications Module (`/notifications`)
- `PATCH /read-all` - Mark all user notifications as read
- `GET /` - List user notifications
- `GET /:id` - Get a notification by ID
- `PATCH /:id/read` - Mark a single notification as read

### Board Pack Module (`/meetings/:meetingId/board-pack`)
- `GET /` - Get full board pack JSON data
- `GET /pdf` - Download generated board pack PDF

## 5. Security Architecture
- **JWT Auth Flow**: Protected endpoints use `@UseGuards(JwtAuthGuard)`. Identity is bound to the `@CurrentUser()` decorator.
- **Tenant Isolation Pattern**: Deeply enforced at the service layer via `OrganisationsService.requireMembership(organisationId, userId)`. The backend *never* trusts client-provided target organisation IDs and resolves them internally from existing DB records.
- **Role-Based Authorization**: Within an organisation, members have explicit roles (e.g., BOARD_ADMIN, CHAIR, SECRETARY). Only specific roles are allowed to edit meetings, agendas, or invite members.

## 6. Error Handling Conventions
- **Try/Catch Blocks**: Used extensively around external IO/Prisma calls.
- **NestJS Logger**: Used to log tracebacks securely on the server.
- **Safe 500s**: Standard NestJS HTTP Exceptions (`InternalServerErrorException`, `NotFoundException`, `ForbiddenException`, `ConflictException`) are thrown. No raw Prisma errors or database schemas are ever leaked to the client.

## 7. CI Workflow
A GitHub Actions workflow (`.github/workflows/backend-ci.yml`) runs on `push` and `pull_request` to `main` checking the `backend/` path.
It ensures code quality by running:
1. `npm ci`
2. `npx prisma format --check`
3. `npx prisma validate`
4. `npx prisma generate`
5. `npm run build`
6. `npm test`

## 8. Local Setup
1. `npm install`
2. Set up your `.env` using `.env.example` (requires a valid `DATABASE_URL` and `JWT_SECRET`).
3. Apply migrations to your local Postgres instance: `npx prisma migrate dev`
4. Start the development server: `npm run start:dev`

## 9. Remaining / Future Work
- **Notifications Creation Hookup**: The Notification read/update API exists, but system event triggers (e.g. creating notifications when a meeting is created or agenda published) are NOT wired up yet.
- **File Uploads Implementation**: The Documents module only stores metadata. Actual binary file uploading (to S3, Azure, or local disk) remains unimplemented.
- **PostgreSQL Runtime Validation**: A full runtime smoke test against a live PostgreSQL instance hasn't been rigorously conducted (mock databases were heavily used in development).
- **API Documentation**: Swagger/OpenAPI setup is missing.
- **Production Configuration**: Need a proper `Dockerfile`, production build steps, and environment config.

## 10. Development Rules & Conventions
- **Backend Only**: Do not introduce UI files or mix React into the NestJS codebase.
- **Tenant Isolation**: Mandatory on all new endpoints. Always verify org membership via `requireMembership` before performing a mutation.
- **Reuse Prisma Models**: Use existing models defined in `schema.prisma`. Do not duplicate fields or create redundant schemas to sidestep existing relations.
