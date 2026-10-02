import { OrderConfirmationEmailData, ConcursoEmailInfo, ConcursoGanadorEmailData, OwnerOrderNotificationData, OwnerConcursoNotificationData } from '../../application/email/ports/email.port';

const ORIGIN_LABEL: Record<string, string> = {
  WEB: 'MercadoPago',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  CASH: 'Efectivo',
};

function formatCLP(amount: number): string {
  return `$ ${amount.toLocaleString('es-CL')}`;
}

export function buildOrderConfirmationHtml(data: OrderConfirmationEmailData): string {
  const greeting = data.customerName ? `Hola, ${data.customerName}` : 'Hola';
  const origin = ORIGIN_LABEL[data.paymentOrigin ?? 'WEB'] ?? 'MercadoPago';
  const shortId = data.orderId.slice(0, 8).toUpperCase();
  const date = data.createdAt.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#e2e8f0;font-size:14px;">
          ${item.productName ?? item.sku}
          <br/>
          <span style="font-size:12px;color:#64748b;">${item.sku}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#94a3b8;font-size:14px;text-align:center;">
          ${item.quantity}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#e2e8f0;font-size:14px;text-align:right;white-space:nowrap;">
          ${formatCLP(item.price)}
        </td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Confirmación de orden · jocoso.cl</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0f14;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#111318;border-radius:16px;border:1px solid rgba(46,230,255,0.15);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d0f14 0%,#111318 50%,#0d1a2e 100%);padding:32px 32px 24px;border-bottom:1px solid rgba(46,230,255,0.12);text-align:center;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:800;letter-spacing:0.05em;color:#2EE6FF;text-transform:uppercase;">
                JOCOSO.CL
              </p>
              <p style="margin:0;font-size:13px;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;">
                Confirmación de orden
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">

              <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#f1f5f9;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;">
                Tu compra fue confirmada el ${date} via ${origin}.
              </p>

              <!-- Order ID badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:rgba(46,230,255,0.08);border:1px solid rgba(46,230,255,0.25);border-radius:8px;padding:10px 16px;">
                    <span style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">N° de orden</span>
                    <br/>
                    <span style="font-size:15px;font-weight:700;color:#2EE6FF;letter-spacing:0.1em;">#${shortId}</span>
                  </td>
                </tr>
              </table>

              <!-- Items table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.07);border-radius:10px;overflow:hidden;margin-bottom:16px;">
                <thead>
                  <tr style="background:rgba(255,255,255,0.04);">
                    <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Producto</th>
                    <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Cant.</th>
                    <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>

              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:12px 12px 12px 0;text-align:right;">
                    <span style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Total&nbsp;&nbsp;</span>
                    <span style="font-size:20px;font-weight:800;color:#2EE6FF;">${formatCLP(data.totalAmount)}</span>
                  </td>
                </tr>
              </table>

              ${data.concursos && data.concursos.length > 0 ? buildConcursosSection(data.concursos) : ''}

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:0 0 24px;" />

              <!-- Footer message -->
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                Si tienes preguntas sobre tu pedido responde este correo o escríbenos directamente.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:rgba(0,0,0,0.3);padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">
                © ${new Date().getFullYear()} jocoso.cl · Tecnología al mejor precio
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

function buildConcursosSection(concursos: ConcursoEmailInfo[]): string {
  const items = concursos.map((c) => {
    const hasta = c.fechaHasta
      ? `Válido hasta ${c.fechaHasta.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}`
      : 'Sin fecha de cierre definida';
    return `
      <tr>
        <td style="padding:12px;border-bottom:1px solid rgba(46,230,255,0.1);">
          <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#2EE6FF;">${c.titulo}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">${hasta} · Compras desde ${formatCLP(c.montoMinimo)}</p>
          <a href="${c.reglasUrl}" style="font-size:12px;color:#2EE6FF;margin-right:16px;">Ver bases del concurso</a>
          <a href="${c.legalesUrl}" style="font-size:12px;color:#64748b;">Términos legales</a>
        </td>
      </tr>`;
  }).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(46,230,255,0.25);border-radius:10px;overflow:hidden;margin-bottom:24px;background:rgba(46,230,255,0.04);">
      <thead>
        <tr style="background:rgba(46,230,255,0.08);">
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#2EE6FF;text-transform:uppercase;letter-spacing:0.06em;">
            🎉 ¡Tu compra participa en un concurso!
          </th>
        </tr>
      </thead>
      <tbody>${items}</tbody>
    </table>`;
}

export function buildOrderConfirmationSubject(orderId: string): string {
  return `Jocoso · Orden #${orderId.slice(0, 8).toUpperCase()} confirmada`;
}

// ─── Winner email ─────────────────────────────────────────────────────────────

export function buildConcursoGanadorSubject(titulo: string): string {
  return `🏆 ¡Felicitaciones! Ganaste el concurso "${titulo}"`;
}

export function buildConcursoGanadorHtml(data: ConcursoGanadorEmailData): string {
  const greeting = data.customerName ? `Hola, ${data.customerName}` : 'Hola';
  const shortId = data.ordenId.slice(0, 8).toUpperCase();
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>¡Ganaste! · jocoso.cl</title></head>
<body style="margin:0;padding:0;background-color:#0d0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0f14;min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#111318;border-radius:16px;border:1px solid rgba(46,230,255,0.15);overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#0d0f14 0%,#111318 50%,#0d1a2e 100%);padding:32px 32px 24px;border-bottom:1px solid rgba(46,230,255,0.12);text-align:center;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:800;letter-spacing:0.05em;color:#2EE6FF;text-transform:uppercase;">JOCOSO.CL</p>
            <p style="margin:0;font-size:13px;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;">Resultado del concurso</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <div style="text-align:center;margin-bottom:28px;">
              <p style="margin:0;font-size:48px;">🏆</p>
              <p style="margin:8px 0 4px;font-size:22px;font-weight:800;color:#f1f5f9;">¡Felicitaciones!</p>
              <p style="margin:0;font-size:15px;color:#94a3b8;">${greeting}, eres el ganador del concurso</p>
              <p style="margin:8px 0 0;font-size:18px;font-weight:700;color:#2EE6FF;">${data.concursoTitulo}</p>
            </div>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;width:100%;max-width:320px;">
              <tr>
                <td style="background:rgba(46,230,255,0.08);border:1px solid rgba(46,230,255,0.25);border-radius:8px;padding:14px 20px;text-align:center;">
                  <span style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Tu ticket ganador</span><br/>
                  <span style="font-size:18px;font-weight:700;color:#2EE6FF;letter-spacing:0.1em;">#${shortId}</span>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:14px;color:#94a3b8;text-align:center;line-height:1.6;">
              Nos pondremos en contacto contigo a la brevedad para coordinar la entrega de tu premio.<br/>Si tienes consultas responde este correo.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:rgba(0,0,0,0.3);padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;font-size:12px;color:#475569;">© ${new Date().getFullYear()} jocoso.cl · Tecnología al mejor precio</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Owner notifications ──────────────────────────────────────────────────────

export function buildOwnerOrderNotificationSubject(orderId: string, total: number): string {
  return `💰 Nueva venta · #${orderId.slice(0, 8).toUpperCase()} · ${formatCLP(total)}`;
}

export function buildOwnerOrderNotificationHtml(data: OwnerOrderNotificationData): string {
  const shortId = data.orderId.slice(0, 8).toUpperCase();
  const date = data.createdAt.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const ORIGIN_LABEL: Record<string, string> = { WEB: 'MercadoPago', CARD: 'Tarjeta', TRANSFER: 'Transferencia', CASH: 'Efectivo', ML: 'MercadoLibre' };
  const origin = ORIGIN_LABEL[data.paymentOrigin ?? 'WEB'] ?? data.paymentOrigin ?? '—';
  const itemRows = data.items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#e2e8f0;font-size:13px;">${i.productName ?? i.sku}</td>
      <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#94a3b8;font-size:13px;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#e2e8f0;font-size:13px;text-align:right;">${formatCLP(i.price)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><title>Nueva venta · jocoso.cl</title></head>
<body style="margin:0;padding:0;background-color:#0d0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0f14;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#111318;border-radius:16px;border:1px solid rgba(46,230,255,0.15);overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#0d0f14,#0d1a2e);padding:24px 32px;border-bottom:1px solid rgba(46,230,255,0.12);">
            <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">JOCOSO.CL · Notificación interna</p>
            <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#2EE6FF;">💰 Nueva venta · #${shortId}</p>
          </td>
        </tr>
        <tr><td style="padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.07);">
            <tr>
              <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#64748b;width:120px;">Cliente</td>
              <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#e2e8f0;">${data.customerName ?? '—'}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#64748b;">Email</td>
              <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#e2e8f0;">${data.customerEmail}</td>
            </tr>
            ${data.customerPhone ? `<tr><td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#64748b;">Teléfono</td><td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#e2e8f0;">${data.customerPhone}</td></tr>` : ''}
            <tr>
              <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#64748b;">Fecha</td>
              <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#e2e8f0;">${date}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:13px;color:#64748b;">Medio de pago</td>
              <td style="padding:10px 14px;font-size:13px;color:#e2e8f0;">${origin}</td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.07);border-radius:8px;overflow:hidden;margin-bottom:16px;">
            <thead><tr style="background:rgba(255,255,255,0.04);">
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;">Producto</th>
              <th style="padding:8px 12px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase;">Cant.</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase;">Precio</th>
            </tr></thead>
            <tbody>${itemRows}</tbody>
          </table>
          <p style="margin:0;text-align:right;font-size:16px;font-weight:800;color:#2EE6FF;">Total: ${formatCLP(data.totalAmount)}</p>
        </td></tr>
        <tr><td style="background:rgba(0,0,0,0.3);padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="margin:0;font-size:11px;color:#475569;">© ${new Date().getFullYear()} jocoso.cl</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function buildOwnerConcursoNotificationSubject(data: OwnerConcursoNotificationData): string {
  return data.event === 'created'
    ? `🎉 Nuevo concurso creado · "${data.concursoTitulo}"`
    : `🏁 Concurso finalizado · "${data.concursoTitulo}"`;
}

export function buildOwnerConcursoNotificationHtml(data: OwnerConcursoNotificationData): string {
  const isCreated = data.event === 'created';
  const fmtDate = (d: Date) => d.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
  const ganadorSection = !isCreated ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:rgba(245,158,11,0.06);border-radius:8px;border:1px solid rgba(245,158,11,0.25);">
      <tr><td style="padding:10px 14px;border-bottom:1px solid rgba(245,158,11,0.15);font-size:13px;color:#64748b;width:120px;">Ganador</td>
          <td style="padding:10px 14px;border-bottom:1px solid rgba(245,158,11,0.15);font-size:13px;color:#e2e8f0;font-weight:600;">${data.ganadorFallbackNombre ?? data.ganadorNombre ?? '—'} ${data.ganadorFallbackNombre ? '<span style="font-size:11px;color:#f59e0b;">(alternativo)</span>' : ''}</td></tr>
      ${data.ganadorEmail ? `<tr><td style="padding:10px 14px;border-bottom:1px solid rgba(245,158,11,0.15);font-size:13px;color:#64748b;">Email</td><td style="padding:10px 14px;border-bottom:1px solid rgba(245,158,11,0.15);font-size:13px;color:#e2e8f0;">${data.ganadorEmail}</td></tr>` : ''}
      ${data.ganadorPhone ? `<tr><td style="padding:10px 14px;border-bottom:1px solid rgba(245,158,11,0.15);font-size:13px;color:#64748b;">Teléfono</td><td style="padding:10px 14px;border-bottom:1px solid rgba(245,158,11,0.15);font-size:13px;color:#e2e8f0;">${data.ganadorPhone}</td></tr>` : ''}
      ${data.ganadorOrdenId ? `<tr><td style="padding:10px 14px;font-size:13px;color:#64748b;">Orden</td><td style="padding:10px 14px;font-size:13px;color:#2EE6FF;font-weight:700;">#${data.ganadorOrdenId.slice(0,8).toUpperCase()}</td></tr>` : ''}
    </table>` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><title>Concurso · jocoso.cl</title></head>
<body style="margin:0;padding:0;background-color:#0d0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0f14;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#111318;border-radius:16px;border:1px solid rgba(46,230,255,0.15);overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#0d0f14,#0d1a2e);padding:24px 32px;border-bottom:1px solid rgba(46,230,255,0.12);">
            <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">JOCOSO.CL · Notificación interna</p>
            <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#2EE6FF;">${isCreated ? '🎉 Nuevo concurso creado' : '🏁 Concurso finalizado'}</p>
          </td>
        </tr>
        <tr><td style="padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.07);">
            <tr><td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#64748b;width:120px;">Título</td>
                <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#e2e8f0;font-weight:600;">${data.concursoTitulo}</td></tr>
            <tr><td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#64748b;">Monto mínimo</td>
                <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#e2e8f0;">${formatCLP(data.montoMinimo)}</td></tr>
            <tr><td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#64748b;">Fecha desde</td>
                <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#e2e8f0;">${fmtDate(data.fechaDesde)}</td></tr>
            <tr><td style="padding:10px 14px;font-size:13px;color:#64748b;">Fecha hasta</td>
                <td style="padding:10px 14px;font-size:13px;color:#e2e8f0;">${data.fechaHasta ? fmtDate(data.fechaHasta) : 'Sin límite'}</td></tr>
          </table>
          ${ganadorSection}
        </td></tr>
        <tr><td style="background:rgba(0,0,0,0.3);padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="margin:0;font-size:11px;color:#475569;">© ${new Date().getFullYear()} jocoso.cl</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
