import { Injectable } from '@nestjs/common';
import { AddressProps } from '../../../domain/auth/entities/address.entity';

@Injectable()
export class ZplLabelService {
  generate(orderId: string, trackingCode: string, address: AddressProps, itemCount: number, total: number): string {
    const shortOrder = orderId.slice(0, 8).toUpperCase();
    const recipient = this.zpl(address.fullName, 40);
    const rut       = this.zpl(`RUT: ${address.rut}`, 40);
    const street    = this.zpl(`${address.calle} ${address.numero}${address.depto ? `, ${address.depto}` : ''}`, 40);
    const commune   = this.zpl(`${address.comuna}, ${address.ciudad}`, 40);
    const region    = this.zpl(address.region, 40);
    const phone     = this.zpl(`Tel: ${address.phone}`, 40);
    const email     = address.email ? this.zpl(address.email, 40) : null;
    const orderLine = this.zpl(`Orden: #${shortOrder}  |  ${itemCount} item(s)  |  $${total.toLocaleString('es-CL')}`, 60);

    return [
      '^XA',
      '^PW1218',        // 152mm a 203dpi
      '^LL813',         // 101mm a 203dpi
      '^CI28',          // UTF-8

      // ── Remitente ───────────────────────────────────────────────────────────
      '^FO30,30^A0N,28,28^FDJOCOSO.CL^FS',
      '^FO30,62^A0N,20,20^FDtienda de tecnología^FS',
      '^FO30,86^GB1158,2,2^FS',

      // ── Etiqueta Starken ────────────────────────────────────────────────────
      '^FO30,100^A0N,24,24^FDESPACHO STARKEN^FS',
      '^FO30,130^A0N,20,20^FDTracking: ^FS',
      `^FO170,128^A0N,22,22^FD${trackingCode}^FS`,

      // ── Destinatario ────────────────────────────────────────────────────────
      '^FO30,165^GB1158,2,1^FS',
      '^FO30,172^A0N,20,20^FDDESTINATARIO^FS',
      `^FO30,198^A0N,26,26^FD${recipient}^FS`,
      `^FO30,228^A0N,22,22^FD${rut}^FS`,
      `^FO30,254^A0N,22,22^FD${street}^FS`,
      `^FO30,278^A0N,22,22^FD${commune}^FS`,
      `^FO30,302^A0N,22,22^FD${region}^FS`,
      `^FO30,326^A0N,22,22^FD${phone}^FS`,
      ...(email ? [`^FO30,350^A0N,20,20^FD${email}^FS`] : []),

      // ── Datos orden ─────────────────────────────────────────────────────────
      '^FO30,376^GB1158,2,1^FS',
      `^FO30,386^A0N,20,20^FD${orderLine}^FS`,

      // ── Código de barras Code128 ─────────────────────────────────────────
      '^FO30,412^GB1158,2,1^FS',
      `^FO150,427^BCN,100,Y,N,N^FD${trackingCode}^FS`,

      '^XZ',
    ].join('\n');
  }

  private zpl(text: string, max: number): string {
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  }
}
