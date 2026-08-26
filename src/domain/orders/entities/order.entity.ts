import * as crypto from 'crypto';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderOrigin {
  WEB = 'WEB',
  ML = 'ML',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  CASH = 'CASH',
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
  addressId: string | null;
  status: OrderStatus;
  origin: OrderOrigin;
  totalAmount: number;
  trackingCode: string | null;
  shippingLabel: string | null;
  customerNotes: string | null;
  adminNotes: string | null;
  items: OrderItemProps[];
  createdAt: Date;
  updatedAt: Date;
}

export class Order {
  private constructor(
    private readonly id: string,
    private readonly userId: string,
    private addressId: string | null,
    private status: OrderStatus,
    private readonly origin: OrderOrigin,
    private readonly totalAmount: number,
    private trackingCode: string | null,
    private shippingLabel: string | null,
    private customerNotes: string | null,
    private adminNotes: string | null,
    private readonly items: OrderItemProps[],
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(
    userId: string,
    items: Omit<OrderItemProps, 'id' | 'orderId'>[],
    addressId: string | null = null,
    origin: OrderOrigin = OrderOrigin.WEB,
  ): Order {
    const id = crypto.randomUUID();
    const now = new Date();
    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const orderItems: OrderItemProps[] = items.map((i) => ({ id: crypto.randomUUID(), orderId: id, ...i }));
    return new Order(id, userId, addressId, OrderStatus.PENDING, origin, totalAmount, null, null, null, null, orderItems, now, now);
  }

  static reconstitute(props: OrderProps): Order {
    return new Order(
      props.id, props.userId, props.addressId, props.status, props.origin, props.totalAmount,
      props.trackingCode, props.shippingLabel, props.customerNotes, props.adminNotes,
      props.items, props.createdAt, props.updatedAt,
    );
  }

  getId(): string { return this.id; }
  getUserId(): string { return this.userId; }
  getAddressId(): string | null { return this.addressId; }
  getStatus(): OrderStatus { return this.status; }
  getOrigin(): OrderOrigin { return this.origin; }
  getTotalAmount(): number { return this.totalAmount; }
  getTrackingCode(): string | null { return this.trackingCode; }
  getShippingLabel(): string | null { return this.shippingLabel; }
  getItems(): OrderItemProps[] { return this.items; }

  setShippingLabel(trackingCode: string, zpl: string): void {
    this.trackingCode = trackingCode;
    this.shippingLabel = zpl;
    this.touch();
  }

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

  private transition(next: OrderStatus): void { this.status = next; this.touch(); }
  private touch(): void { this.updatedAt = new Date(); }

  toPersistence(): OrderProps {
    return {
      id: this.id, userId: this.userId, addressId: this.addressId,
      status: this.status, origin: this.origin, totalAmount: this.totalAmount,
      trackingCode: this.trackingCode, shippingLabel: this.shippingLabel,
      customerNotes: this.customerNotes, adminNotes: this.adminNotes,
      items: this.items, createdAt: this.createdAt, updatedAt: this.updatedAt,
    };
  }
}
