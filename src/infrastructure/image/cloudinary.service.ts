import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { IImageService, UploadImageInput, UploadImageResult } from '../../application/image/ports/image.port';

@Injectable()
export class CloudinaryService implements IImageService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly defaultFolder: string;

  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.getOrThrow('CLOUDINARY_CLOUD_NAME'),
      api_key: config.getOrThrow('CLOUDINARY_API_KEY'),
      api_secret: config.getOrThrow('CLOUDINARY_API_SECRET'),
    });
    this.defaultFolder = config.get('CLOUDINARY_FOLDER', 'jocoso');
  }

  async upload(input: UploadImageInput): Promise<UploadImageResult> {
    const folder = input.folder ?? this.defaultFolder;

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      stream.end(input.buffer);
    });
  }

  async delete(publicId: string): Promise<void> {
    const { result } = await cloudinary.uploader.destroy(publicId);
    if (result !== 'ok' && result !== 'not found') {
      this.logger.warn(`Cloudinary delete unexpected result for ${publicId}: ${result}`);
    }
  }
}
