import * as crypto from 'crypto';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItemProps {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  price: number;
}

export interface OrderProps {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItemProps[];
  createdAt: Date;
  updatedAt: Date;
}

export class Order {
  private constructor(
    private readonly id: string,
    private readonly userId: string,
    private status: OrderStatus,
    private readonly totalAmount: number,
    private readonly items: OrderItemProps[],
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(userId: string, items: Omit<OrderItemProps, 'id' | 'orderId'>[]): Order {
    const id = crypto.randomUUID();
    const now = new Date();
    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const orderItems: OrderItemProps[] = items.map((i) => ({
      id: crypto.randomUUID(),
      orderId: id,
      ...i,
    }));
    return new Order(id, userId, OrderStatus.PENDING, totalAmount, orderItems, now, now);
  }

  static reconstitute(props: OrderProps): Order {
    return new Order(props.id, props.userId, props.status, props.totalAmount, props.items, props.createdAt, props.updatedAt);
  }

  getId(): string { return this.id; }
  getUserId(): string { return this.userId; }
  getStatus(): OrderStatus { return this.status; }
  getTotalAmount(): number { return this.totalAmount; }
  getItems(): OrderItemProps[] { return this.items; }

  confirm(): void { this.transition(OrderStatus.CONFIRMED); }
  process(): void { this.transition(OrderStatus.PROCESSING); }
  ship(): void { this.transition(OrderStatus.SHIPPED); }
  complete(): void { this.transition(OrderStatus.COMPLETED); }
  cancel(): void {
    if ([OrderStatus.SHIPPED, OrderStatus.COMPLETED].includes(this.status)) {
      throw new Error(`Cannot cancel order in status ${this.status}`);
    }
    this.status = OrderStatus.CANCELLED;
    this.touch();
  }

  private transition(next: OrderStatus): void {
    this.status = next;
    this.touch();
  }

  private touch(): void { this.updatedAt = new Date(); }

  toPersistence(): OrderProps {
    return { id: this.id, userId: this.userId, status: this.status, totalAmount: this.totalAmount, items: this.items, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
