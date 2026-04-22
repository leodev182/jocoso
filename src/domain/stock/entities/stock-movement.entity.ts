import * as crypto from 'crypto';

export enum StockSource {
  WEB = 'WEB',
  ML = 'ML',
  ADMIN = 'ADMIN',
}

export enum ReferenceType {
  ORDER = 'ORDER',
  ML_SALE = 'ML_SALE',
  MANUAL = 'MANUAL',
}

export interface StockMovementProps {
  id: string;
  variantId: string;
  quantity: number;
  source: StockSource;
  referenceType: ReferenceType;
  referenceId: string | null;
  externalId: string | null;
  userId: string | null;
  createdAt: Date;
}

export interface CreateMovementProps {
  variantId: string;
  quantity: number;
  source: StockSource;
  referenceType: ReferenceType;
  referenceId?: string;
  externalId?: string;
  userId?: string;
}

export class StockMovement {
  private constructor(
    private readonly id: string,
    private readonly variantId: string,
    private readonly quantity: number,
    private readonly source: StockSource,
    private readonly referenceType: ReferenceType,
    private readonly referenceId: string | null,
    private readonly externalId: string | null,
    private readonly userId: string | null,
    private readonly createdAt: Date,
  ) {}

  static create(props: CreateMovementProps): StockMovement {
    return new StockMovement(
      crypto.randomUUID(),
      props.variantId,
      props.quantity,
      props.source,
      props.referenceType,
      props.referenceId ?? null,
      props.externalId ?? null,
      props.userId ?? null,
      new Date(),
    );
  }

  static reconstitute(props: StockMovementProps): StockMovement {
    return new StockMovement(
      props.id, props.variantId, props.quantity, props.source,
      props.referenceType, props.referenceId, props.externalId,
      props.userId, props.createdAt,
    );
  }

  getId(): string { return this.id; }
  getVariantId(): string { return this.variantId; }
  getQuantity(): number { return this.quantity; }
  getSource(): StockSource { return this.source; }
  getReferenceType(): ReferenceType { return this.referenceType; }
  getReferenceId(): string | null { return this.referenceId; }
  getExternalId(): string | null { return this.externalId; }
  getUserId(): string | null { return this.userId; }

  toPersistence(): StockMovementProps {
    return {
      id: this.id,
      variantId: this.variantId,
      quantity: this.quantity,
      source: this.source,
      referenceType: this.referenceType,
      referenceId: this.referenceId,
      externalId: this.externalId,
      userId: this.userId,
      createdAt: this.createdAt,
    };
  }
}
