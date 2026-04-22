import { UnprocessableEntityException } from '@nestjs/common';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';

export class ProductDomainService {
  validateMlMapping(product: Product, variant: ProductVariant): void {
    if (variant.getMlVariationId() && !product.getMlItemId()) {
      throw new UnprocessableEntityException(
        'Cannot assign mlVariationId to variant without mlItemId on Product',
      );
    }
  }
}
