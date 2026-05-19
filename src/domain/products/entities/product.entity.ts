import * as crypto from 'crypto';

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PAUSED = 'PAUSED',
}

export interface ProductProps {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  brand: string | null;
  status: ProductStatus;
  featured: boolean;
  mlItemId: string | null;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class Product {
  private constructor(
    private readonly id: string,
    private title: string,
    private slug: string | null,
    private description: string | null,
    private brand: string | null,
    private status: ProductStatus,
    private featured: boolean,
    private mlItemId: string | null,
    private images: string[],
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(title: string, description?: string): Product {
    const now = new Date();
    return new Product(crypto.randomUUID(), title, null, description ?? null, null, ProductStatus.ACTIVE, false, null, [], now, now);
  }

  static reconstitute(props: ProductProps): Product {
    return new Product(props.id, props.title, props.slug, props.description, props.brand, props.status, props.featured, props.mlItemId, props.images ?? [], props.createdAt, props.updatedAt);
  }

  getId(): string { return this.id; }
  getTitle(): string { return this.title; }
  getSlug(): string | null { return this.slug; }
  getDescription(): string | null { return this.description; }
  getBrand(): string | null { return this.brand; }
  getStatus(): ProductStatus { return this.status; }
  isFeatured(): boolean { return this.featured; }
  getMlItemId(): string | null { return this.mlItemId; }
  getImages(): string[] { return this.images; }

  updateTitle(title: string): void { this.title = title; this.touch(); }
  updateSlug(slug: string | null): void { this.slug = slug; this.touch(); }
  updateDescription(desc: string | null): void { this.description = desc; this.touch(); }
  updateBrand(brand: string | null): void { this.brand = brand; this.touch(); }
  updateStatus(status: ProductStatus): void { this.status = status; this.touch(); }
  setFeatured(featured: boolean): void { this.featured = featured; this.touch(); }
  assignMlItemId(mlItemId: string): void { this.mlItemId = mlItemId; this.touch(); }
  setImages(images: string[]): void { this.images = images; this.touch(); }

  private touch(): void { this.updatedAt = new Date(); }

  toPersistence(): ProductProps {
    return { id: this.id, title: this.title, slug: this.slug, description: this.description, brand: this.brand, status: this.status, featured: this.featured, mlItemId: this.mlItemId, images: this.images, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
