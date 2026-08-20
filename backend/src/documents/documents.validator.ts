import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import * as path from 'path';

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'image/png',
  'image/jpeg',
]);

const EXTENSION_MIME_MAP: Record<string, Set<string>> = {
  '.pdf': new Set(['application/pdf']),
  '.doc': new Set(['application/msword']),
  '.docx': new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  '.xls': new Set(['application/vnd.ms-excel']),
  '.xlsx': new Set(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  '.png': new Set(['image/png']),
  '.jpg': new Set(['image/jpeg']),
  '.jpeg': new Set(['image/jpeg']),
};

export function validateDocumentUpload(file: Express.Multer.File): void {
  if (!file) {
    throw new BadRequestException('No file provided');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new PayloadTooLargeException(`File size exceeds the 20MB limit. Received: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
  }

  const mimeType = file.mimetype.toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new BadRequestException(`Unsupported file type: ${mimeType}`);
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimeForExt = EXTENSION_MIME_MAP[ext];

  if (!allowedMimeForExt) {
    throw new BadRequestException(`Unsupported file extension: ${ext}`);
  }

  if (!allowedMimeForExt.has(mimeType)) {
    throw new BadRequestException(`MIME type '${mimeType}' does not match file extension '${ext}'`);
  }
}

export function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename);
  const baseName = path.basename(filename, ext);
  
  // Remove control characters, path traversals, and limit charset to alphanumeric, space, dot, dash, underscore
  const sanitizedBase = baseName
    .replace(/[^a-zA-Z0-9_\-\.\ ]/g, '_')
    .replace(/\s+/g, ' ')
    .trim() || 'unnamed_file';
    
  return sanitizedBase + ext.toLowerCase();
}
