import { pool } from '../db/config';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

export interface FileRecord {
  id: string;
  userId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  storageProvider: string;
  storagePath: string;
  storageBucket?: string;
  encrypted: boolean;
  virusScanned: boolean;
  virusScanResult?: string;
  isPublic: boolean;
  fileType?: string;
  tags?: string[];
  description?: string;
  createdAt: Date;
}

export interface UploadFileInput {
  userId: string;
  file: Express.Multer.File;
  fileType?: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
}

export class FileService {
  private readonly localStoragePath = path.join(__dirname, '../../uploads');
  private readonly useS3 = !!process.env.AWS_ACCESS_KEY_ID;

  constructor() {
    // Ensure local storage directory exists
    if (!this.useS3 && !fs.existsSync(this.localStoragePath)) {
      fs.mkdirSync(this.localStoragePath, { recursive: true });
    }
  }

  async uploadFile(input: UploadFileInput): Promise<FileRecord> {
    const id = uuidv4();
    const filename = `${id}-${input.file.originalname}`;
    
    let storagePath: string;
    let storageProvider: string;
    let storageBucket: string | undefined;

    if (this.useS3) {
      // Upload to S3
      storagePath = await this.uploadToS3(filename, input.file.buffer);
      storageProvider = 's3';
      storageBucket = process.env.AWS_S3_BUCKET;
    } else {
      // Store locally
      storagePath = path.join(this.localStoragePath, filename);
      fs.writeFileSync(storagePath, input.file.buffer);
      storageProvider = 'local';
    }

    // Create thumbnail for images
    if (input.file.mimetype.startsWith('image/')) {
      await this.createThumbnail(input.file.buffer, filename);
    }

    // Insert file record
    const result = await pool.query(
      `INSERT INTO files (
        id, user_id, filename, original_filename, mime_type, size_bytes,
        storage_provider, storage_path, storage_bucket, file_type,
        tags, description, is_public, virus_scanned
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, FALSE)
      RETURNING *`,
      [
        id,
        input.userId,
        filename,
        input.file.originalname,
        input.file.mimetype,
        input.file.size,
        storageProvider,
        storagePath,
        storageBucket,
        input.fileType,
        input.tags,
        input.description,
        input.isPublic || false,
      ]
    );

    return this.mapToFileRecord(result.rows[0]);
  }

  async getFile(fileId: string): Promise<FileRecord | null> {
    const result = await pool.query(
      'SELECT * FROM files WHERE id = $1 AND deleted_at IS NULL',
      [fileId]
    );

    if (result.rows.length === 0) return null;
    return this.mapToFileRecord(result.rows[0]);
  }

  async getUserFiles(userId: string): Promise<FileRecord[]> {
    const result = await pool.query(
      `SELECT * FROM files 
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map(row => this.mapToFileRecord(row));
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    const file = await this.getFile(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.storageProvider === 's3') {
      return this.downloadFromS3(file.storagePath);
    } else {
      return fs.readFileSync(file.storagePath);
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    // Soft delete
    await pool.query(
      'UPDATE files SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [fileId]
    );
  }

  async generatePresignedUrl(fileId: string, expiresIn: number = 3600): Promise<string> {
    const file = await this.getFile(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.storageProvider !== 's3') {
      throw new Error('Presigned URLs only available for S3 files');
    }

    const params = {
      Bucket: file.storageBucket!,
      Key: file.storagePath,
      Expires: expiresIn,
    };

    return s3.getSignedUrlPromise('getObject', params);
  }

  private async uploadToS3(filename: string, buffer: Buffer): Promise<string> {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: filename,
      Body: buffer,
    };

    await s3.upload(params).promise();
    return filename;
  }

  private async downloadFromS3(key: string): Promise<Buffer> {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    };

    const data = await s3.getObject(params).promise();
    return data.Body as Buffer;
  }

  private async createThumbnail(buffer: Buffer, filename: string): Promise<void> {
    try {
      const thumbnailBuffer = await sharp(buffer)
        .resize(200, 200, { fit: 'cover' })
        .toBuffer();

      const thumbnailFilename = `thumb-${filename}`;

      if (this.useS3) {
        await this.uploadToS3(thumbnailFilename, thumbnailBuffer);
      } else {
        const thumbnailPath = path.join(this.localStoragePath, thumbnailFilename);
        fs.writeFileSync(thumbnailPath, thumbnailBuffer);
      }
    } catch (error) {
      console.error('Failed to create thumbnail:', error);
    }
  }

  private mapToFileRecord(row: any): FileRecord {
    return {
      id: row.id,
      userId: row.user_id,
      filename: row.filename,
      originalFilename: row.original_filename,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      storageProvider: row.storage_provider,
      storagePath: row.storage_path,
      storageBucket: row.storage_bucket,
      encrypted: row.encrypted,
      virusScanned: row.virus_scanned,
      virusScanResult: row.virus_scan_result,
      isPublic: row.is_public,
      fileType: row.file_type,
      tags: row.tags,
      description: row.description,
      createdAt: row.created_at,
    };
  }
}

export const fileService = new FileService();
