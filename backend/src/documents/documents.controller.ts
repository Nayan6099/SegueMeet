import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { QueryDocumentsDto } from './dto/query-documents.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

/**
 * DocumentsController — all endpoints are JWT-protected.
 * Business logic and tenant isolation live entirely in DocumentsService.
 */
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * POST /documents
   * Creates a document metadata record. Storage path must be pre-resolved
   * by the caller (this API stores references, not raw files).
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.createDocument(dto, user);
  }

  /**
   * POST /documents/upload
   * Uploads a file to Cloudinary and creates a document metadata record.
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('organisationId') organisationId: string,
    @Body('meetingId') meetingId: string | undefined,
    @Body('agendaItemId') agendaItemId: string | undefined,
    @Body('folderId') folderId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!organisationId) throw new BadRequestException('organisationId is required');

    return this.documentsService.uploadAndCreateDocument(
      file,
      organisationId,
      meetingId,
      agendaItemId,
      folderId,
      user,
    );
  }

  /**
   * POST /documents/:id/versions
   * Uploads a new version for an existing document.
   */
  @Post(':id/versions')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  uploadNewVersion(
    @Param('id') documentId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.documentsService.uploadNewVersion(documentId, file, user);
  }

  // ─────────────────────────────────────────────
  // FOLDERS
  // ─────────────────────────────────────────────

  @Get('folders')
  getFolders(
    @Query('organisationId') organisationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!organisationId) throw new BadRequestException('organisationId is required');
    return this.documentsService.getFolders(organisationId, user);
  }

  @Post('folders')
  @HttpCode(HttpStatus.CREATED)
  createFolder(
    @Body('organisationId') organisationId: string,
    @Body('name') name: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!organisationId) throw new BadRequestException('organisationId is required');
    if (!name) throw new BadRequestException('name is required');
    return this.documentsService.createFolder(organisationId, name, user);
  }

  /**
   * GET /documents?organisationId=...&meetingId=...&agendaItemId=...
   * Lists documents within the requested organisation scope.
   */
  @Get()
  findAll(
    @Query() query: QueryDocumentsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.getDocuments(query, user);
  }

  /**
   * GET /documents/:id
   * Returns a single document. Organisation is resolved from the DB record.
   */
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.getDocumentById(id, user);
  }

  /**
   * GET /documents/:id/download
   * Proxies the document stream securely through the backend.
   */
  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: any,
  ) {
    const { stream, mimeType, originalName } = await this.documentsService.downloadDocument(id, user);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${originalName}"`,
    });
    return new StreamableFile(stream as any);
  }

  /**
   * PATCH /documents/:id
   * Updates editable metadata fields. organisationId cannot be changed.
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.updateDocument(id, dto, user);
  }

  /**
   * DELETE /documents/:id
   * Removes the document record only — does not delete related resources.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.deleteDocument(id, user);
  }

  // ─────────────────────────────────────────────
  // SHARING
  // ─────────────────────────────────────────────

  @Post(':id/access')
  @HttpCode(HttpStatus.OK)
  shareDocument(
    @Param('id') id: string,
    @Body('userId') targetUserId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!targetUserId) throw new BadRequestException('userId is required');
    return this.documentsService.shareDocument(id, targetUserId, user);
  }

  @Delete(':id/access/:userId')
  @HttpCode(HttpStatus.OK)
  revokeDocumentAccess(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.revokeDocumentAccess(id, targetUserId, user);
  }
}
