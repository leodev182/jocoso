export interface UploadImageInput {
  buffer: Buffer;
  mimetype: string;
  folder?: string;
}

export interface UploadImageResult {
  url: string;
  publicId: string;
}

export interface IImageService {
  upload(input: UploadImageInput): Promise<UploadImageResult>;
  delete(publicId: string): Promise<void>;
}

export const IMAGE_SERVICE = Symbol('IImageService');
