import { Injectable } from '@nestjs/common';
import { AddressProps } from '../../../domain/auth/entities/address.entity';

// Dimensiones: 152mm x 101mm a 203dpi = 1218 x 813 dots (landscape)
// Margen izquierdo 60 dots (~7.5mm) para evitar pérdida de texto en el borde físico
const L = 60;   // left margin
const W = 1098; // ancho útil (1218 - 60 - 60)

@Injectable()
export class ZplLabelService {
  generate(
    orderId: string,
    trackingCode: string | null,
    address: AddressProps,
    itemCount?: number,
    total?: number,
  ): string {
    const shortOrder = orderId.slice(0, 8).toUpperCase();
    const recipient  = this.zpl(address.fullName, 38);
    const rut        = this.zpl(address.rut, 20);
    const phone      = this.zpl(address.phone, 20);
    const street     = this.zpl(`${address.calle} ${address.numero}${address.depto ? ` ${address.depto}` : ''}`, 45);
    const commune    = this.zpl(`${address.comuna}, ${address.ciudad}`, 45);
    const region     = this.zpl(address.region, 45);
    const email      = address.email ? this.zpl(address.email, 38) : null;

    const hasTracking = !!trackingCode;
    const hasOrder    = itemCount != null && total != null;
    const orderLine   = hasOrder
      ? this.zpl(`Orden #${shortOrder}  ·  ${itemCount} item(s)  ·  $${total!.toLocaleString('es-CL')}`, 65)
      : null;

    // QR: codifica datos del destinatario para escaneo rápido
    const qrContent = [
      address.fullName,
      address.rut,
      address.phone,
      `${address.calle} ${address.numero}${address.depto ? ` ${address.depto}` : ''}`,
      `${address.comuna}, ${address.ciudad}`,
      address.region,
      ...(address.email ? [address.email] : []),
    ].join(' | ');

    return [
      '^XA',
      `^PW1218`,
      `^LL813`,
      '^CI28',

      // ── Encabezado ──────────────────────────────────────────────────────────
      `^FO${L},22^A0N,42,42^FDJOCOSO.CL^FS`,
      `^FO${L},70^A0N,22,22^FDtienda de tecnología^FS`,

      // QR con datos del destinatario (esquina superior derecha)
      `^FO880,18^BQN,2,5^FDQA,${qrContent}^FS`,

      `^FO${L},100^GB${W},3,3^FS`,

      // ── Starken / tracking ──────────────────────────────────────────────────
      `^FO${L},110^A0N,26,26^FDESPACHO STARKEN^FS`,
      ...(hasTracking ? [
        `^FO${L},144^A0N,22,22^FDTracking:^FS`,
        `^FO${L + 160},142^A0N,24,24^FD${trackingCode}^FS`,
      ] : [
        `^FO${L},144^A0N,20,20^FDSin número de seguimiento^FS`,
      ]),

      // ── Destinatario ────────────────────────────────────────────────────────
      `^FO${L},178^GB${W},2,2^FS`,
      `^FO${L},186^A0N,20,20^FDDESTINATARIO^FS`,
      `^FO${L},212^A0N,32,32^FD${recipient}^FS`,

      // RUT y teléfono en la misma línea
      `^FO${L},252^A0N,24,24^FDRUT: ${rut}^FS`,
      `^FO${L + 440},252^A0N,24,24^FDTel: ${phone}^FS`,

      `^FO${L},284^A0N,24,24^FD${street}^FS`,
      `^FO${L},314^A0N,24,24^FD${commune}^FS`,
      `^FO${L},344^A0N,24,24^FD${region}^FS`,
      ...(email ? [`^FO${L},374^A0N,22,22^FD${email}^FS`] : []),

      // ── Datos orden ─────────────────────────────────────────────────────────
      ...(orderLine ? [
        `^FO${L},${email ? 406 : 378}^GB${W},2,2^FS`,
        `^FO${L},${email ? 416 : 388}^A0N,22,22^FD${orderLine}^FS`,
      ] : []),

      // ── Código de barras Code128 ─────────────────────────────────────────
      ...(hasTracking ? [
        `^FO${L},${this.barcodeY(!!email, !!orderLine)}^GB${W},2,2^FS`,
        `^FO${L + 80},${this.barcodeY(!!email, !!orderLine) + 12}^BCN,110,Y,N,N^FD${trackingCode}^FS`,
      ] : []),

      '^XZ',
    ].join('\n');
  }

  private barcodeY(hasEmail: boolean, hasOrder: boolean): number {
    if (hasEmail && hasOrder) return 446;
    if (hasEmail || hasOrder) return 418;
    return 390;
  }

  private zpl(text: string, max: number): string {
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  }
}
