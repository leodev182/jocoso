import { Controller, Post, UploadedFile, UseGuards, UseInterceptors, BadRequestException, Inject, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { RolesGuard } from '../../../infrastructure/security/guards/roles.guard';
import { Roles } from '../../../interfaces/http/common/decorators/roles.decorator';
import { IImageService, IMAGE_SERVICE } from '../../../application/image/ports/image.port';

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@ApiTags('images')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('images')
export class ImagesController {
  constructor(@Inject(IMAGE_SERVICE) private readonly imageService: IImageService) {}

  @Post('upload')
  @Roles('ADMIN')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_SIZE_BYTES } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      throw new BadRequestException('Formato no permitido. Use JPEG, PNG, WebP o GIF');
    }

    return this.imageService.upload({
      buffer: file.buffer,
      mimetype: file.mimetype,
      folder: folder ?? undefined,
    });
  }
}
