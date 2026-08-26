import { Global, Module } from '@nestjs/common';
import { IMAGE_SERVICE } from '../../application/image/ports/image.port';
import { CloudinaryService } from './cloudinary.service';
import { ImagesController } from '../../interfaces/http/images/images.controller';

@Global()
@Module({
  controllers: [ImagesController],
  providers: [
    { provide: IMAGE_SERVICE, useClass: CloudinaryService },
  ],
  exports: [IMAGE_SERVICE],
})
export class ImageModule {}
