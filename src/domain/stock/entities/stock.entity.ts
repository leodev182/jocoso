export class Stock {
  private constructor(
    private readonly variantId: string,
    private readonly quantity: number,
  ) {}

  static reconstitute(variantId: string, quantity: number): Stock {
    return new Stock(variantId, quantity);
  }

  getVariantId(): string { return this.variantId; }
  getQuantity(): number { return this.quantity; }

  canDecrease(amount: number): boolean {
    return amount > 0 && this.quantity >= amount;
  }
}
