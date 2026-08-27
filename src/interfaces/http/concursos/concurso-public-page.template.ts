export function buildPublicPageHtml(titulo: string, seccion: string, contenido: string): string {
  const parrafos = contenido
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<p>${l}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${seccion} · ${titulo} · jocoso.cl</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;color:#111827;padding:2rem 1rem}
    .page{max-width:720px;margin:0 auto;background:#fff;border-radius:12px;padding:2.5rem;box-shadow:0 1px 4px rgba(0,0,0,.08)}
    .header{border-bottom:2px solid #e5e7eb;padding-bottom:1.25rem;margin-bottom:1.75rem}
    .brand{font-size:.8125rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6366f1;margin-bottom:.375rem}
    h1{font-size:1.5rem;font-weight:700;color:#111827;margin-bottom:.25rem}
    .subtitle{font-size:.875rem;color:#6b7280}
    .content p{font-size:.9375rem;line-height:1.7;color:#374151;margin-bottom:.875rem}
    .content p:last-child{margin-bottom:0}
    .print-btn{display:inline-block;margin-top:1.75rem;padding:.5rem 1.25rem;background:#6366f1;color:#fff;border:none;border-radius:6px;font-size:.875rem;font-weight:500;cursor:pointer}
    @media print{.print-btn{display:none}body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0}}
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <p class="brand">jocoso.cl</p>
      <h1>${titulo}</h1>
      <p class="subtitle">${seccion}</p>
    </div>
    <div class="content">${parrafos}</div>
    <button class="print-btn" onclick="window.print()">Imprimir / Guardar PDF</button>
  </div>
</body>
</html>`;
}
