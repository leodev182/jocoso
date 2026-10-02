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

export interface ConcursoGanadorEmailData {
  customerName: string | null;
  customerEmail: string;
  concursoTitulo: string;
  ordenId: string;
}

export interface OwnerOrderNotificationData {
  orderId: string;
  customerName: string | null;
  customerEmail: string;
  customerPhone: string | null;
  totalAmount: number;
  createdAt: Date;
  paymentOrigin?: string;
  items: Array<{ productName: string | null; sku: string; quantity: number; price: number }>;
}

export interface OwnerConcursoNotificationData {
  event: 'created' | 'finished';
  concursoId: string;
  concursoTitulo: string;
  fechaDesde: Date;
  fechaHasta: Date | null;
  montoMinimo: number;
  ganadorNombre?: string | null;
  ganadorEmail?: string | null;
  ganadorPhone?: string | null;
  ganadorOrdenId?: string | null;
  ganadorFallbackNombre?: string | null;
}

export interface IEmailService {
  sendOrderConfirmation(data: OrderConfirmationEmailData): Promise<void>;
  sendConcursoGanador(data: ConcursoGanadorEmailData): Promise<void>;
  sendOwnerOrderNotification(data: OwnerOrderNotificationData): Promise<void>;
  sendOwnerConcursoNotification(data: OwnerConcursoNotificationData): Promise<void>;
}

export const EMAIL_SERVICE = Symbol('IEmailService');
