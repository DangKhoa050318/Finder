import { Injectable } from '@nestjs/common';

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
}

@Injectable()
export class UploadService {
  /**
   * Process uploaded file and return file info
   */
  processFile(file: Express.Multer.File): UploadedFile {
    // Use full URL for uploaded files
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    return {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `${baseUrl}/uploads/${file.filename}`,
    };
  }

  /**
   * Process multiple uploaded files
   */
  processFiles(files: Express.Multer.File[]): UploadedFile[] {
    return files.map((file) => this.processFile(file));
  }

  /**
   * Validate if file is an image
   */
  isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  /**
   * Validate if file is a document
   */
  isDocument(mimetype: string): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ];
    return documentTypes.includes(mimetype);
  }
}
