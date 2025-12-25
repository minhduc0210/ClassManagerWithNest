import { Injectable } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { Readable } from 'stream';
import { extractPublicId } from 'cloudinary-build-url';

@Injectable()
export class CloudinaryService {
  async uploadFile(
    file: Express.Multer.File,
    folderPath: string,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: folderPath, resource_type: 'auto' },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            return reject(new Error(error.message));
          } else {
            resolve(result as UploadApiResponse);
          }
        },
      );

      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);
      stream.pipe(upload);
    });
  }

  async deleteFile(publicId: string, resourceType: string): Promise<any> {
    return new Promise((resolve, reject) => {
      void cloudinary.uploader.destroy(
        publicId,
        { resource_type: resourceType },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) return reject(new Error(error.message));
          console.log(`Cloudinary Delete Attempt:`, {
            publicId,
            resourceType,
            result,
          });
          resolve(result);
        },
      );
    });
  }

  extractAssetInfo(url: string) {
    const rawPublicId = extractPublicId(url);
    const publicId = decodeURIComponent(rawPublicId);
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    const resourceType = parts[uploadIndex - 1] || 'image';
    return { publicId, resourceType };
  }
}
