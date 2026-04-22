import * as crypto from 'crypto';

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PAUSED = 'PAUSED',
}

export interface ProductProps {
  id: string;
  title: string;
  description: string | null;
  status: ProductStatus;
  mlItemId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Product {
  private constructor(
    private readonly id: string,
    private title: string,
    private description: string | null,
    private status: ProductStatus,
    private mlItemId: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(title: string, description?: string): Product {
    const now = new Date();
    return new Product(crypto.randomUUID(), title, description ?? null, ProductStatus.ACTIVE, null, now, now);
  }

  static reconstitute(props: ProductProps): Product {
    return new Product(props.id, props.title, props.description, props.status, props.mlItemId, props.createdAt, props.updatedAt);
  }

  getId(): string { return this.id; }
  getTitle(): string { return this.title; }
  getDescription(): string | null { return this.description; }
  getStatus(): ProductStatus { return this.status; }
  getMlItemId(): string | null { return this.mlItemId; }

  updateTitle(title: string): void { this.title = title; this.touch(); }
  updateDescription(desc: string | null): void { this.description = desc; this.touch(); }
  updateStatus(status: ProductStatus): void { this.status = status; this.touch(); }
  assignMlItemId(mlItemId: string): void { this.mlItemId = mlItemId; this.touch(); }

  private touch(): void { this.updatedAt = new Date(); }

  toPersistence(): ProductProps {
    return { id: this.id, title: this.title, description: this.description, status: this.status, mlItemId: this.mlItemId, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
