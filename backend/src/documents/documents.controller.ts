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
} from '@nestjs/common';
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
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.getDocumentById(id, user);
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
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.deleteDocument(id, user);
  }
}
