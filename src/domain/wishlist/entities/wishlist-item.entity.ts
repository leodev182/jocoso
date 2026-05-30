import * as crypto from 'crypto';

export class WishlistItem {
  private constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly productId: string,
    private readonly createdAt: Date,
  ) {}

  static create(userId: string, productId: string): WishlistItem {
    return new WishlistItem(crypto.randomUUID(), userId, productId, new Date());
  }

  static reconstitute(props: { id: string; userId: string; productId: string; createdAt: Date }): WishlistItem {
    return new WishlistItem(props.id, props.userId, props.productId, props.createdAt);
  }

  getId(): string { return this.id; }
  getUserId(): string { return this.userId; }
  getProductId(): string { return this.productId; }
  getCreatedAt(): Date { return this.createdAt; }

  toObject() {
    return { id: this.id, userId: this.userId, productId: this.productId, createdAt: this.createdAt };
  }
}
