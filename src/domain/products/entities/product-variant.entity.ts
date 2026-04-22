import * as crypto from 'crypto';

export interface VariantAttribute {
  name: string;
  value: string;
}

export interface ProductVariantProps {
  id: string;
  productId: string;
  sku: string;
  price: number;
  stock: number;
  mlVariationId: string | null;
  attributes: VariantAttribute[];
  createdAt: Date;
  updatedAt: Date;
}

export class ProductVariant {
  private constructor(
    private readonly id: string,
    private readonly productId: string,
    private readonly sku: string,
    private price: number,
    private readonly stock: number,
    private mlVariationId: string | null,
    private attributes: VariantAttribute[],
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(productId: string, sku: string, price: number, attributes: VariantAttribute[] = []): ProductVariant {
    const now = new Date();
    return new ProductVariant(crypto.randomUUID(), productId, sku, price, 0, null, attributes, now, now);
  }

  static reconstitute(props: ProductVariantProps): ProductVariant {
    return new ProductVariant(props.id, props.productId, props.sku, props.price, props.stock, props.mlVariationId, props.attributes, props.createdAt, props.updatedAt);
  }

  getId(): string { return this.id; }
  getProductId(): string { return this.productId; }
  getSku(): string { return this.sku; }
  getPrice(): number { return this.price; }
  getStock(): number { return this.stock; }
  getMlVariationId(): string | null { return this.mlVariationId; }
  getAttributes(): VariantAttribute[] { return this.attributes; }

  updatePrice(price: number): void { this.price = price; this.touch(); }
  assignMlVariationId(id: string): void { this.mlVariationId = id; this.touch(); }
  setAttributes(attributes: VariantAttribute[]): void { this.attributes = attributes; this.touch(); }

  private touch(): void { this.updatedAt = new Date(); }

  toPersistence(): ProductVariantProps {
    return { id: this.id, productId: this.productId, sku: this.sku, price: this.price, stock: this.stock, mlVariationId: this.mlVariationId, attributes: this.attributes, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
