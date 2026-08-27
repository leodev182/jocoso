export interface ConcursoEmailInfo {
  id: string;
  titulo: string;
  montoMinimo: number;
  fechaHasta: Date | null;
  reglasUrl: string;
  legalesUrl: string;
}

export interface OrderConfirmationEmailData {
  orderId: string;
  customerName: string | null;
  customerEmail: string;
  items: Array<{
    productName: string | null;
    sku: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  createdAt: Date;
  paymentOrigin?: 'WEB' | 'CARD' | 'TRANSFER' | 'CASH';
  concursos?: ConcursoEmailInfo[];
}

export interface IEmailService {
  sendOrderConfirmation(data: OrderConfirmationEmailData): Promise<void>;
}

export const EMAIL_SERVICE = Symbol('IEmailService');
