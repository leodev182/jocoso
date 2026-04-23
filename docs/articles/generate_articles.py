#!/usr/bin/env python3
"""Generate 5 technical PDF articles for Jocoso.cl portfolio."""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import Flowable
import os

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ─── Color palette ────────────────────────────────────────────────────────────
DARK_BG       = colors.HexColor('#0F172A')   # header bg
ACCENT_BLUE   = colors.HexColor('#3B82F6')   # headings / bullets
ACCENT_CYAN   = colors.HexColor('#06B6D4')   # sub-headings
CODE_BG       = colors.HexColor('#1E293B')   # code block bg
CODE_FG       = colors.HexColor('#E2E8F0')   # code text
DECISION_BG   = colors.HexColor('#FEF3C7')   # decision box
DECISION_BDR  = colors.HexColor('#F59E0B')   # decision box border
TRADEOFF_BG   = colors.HexColor('#EFF6FF')   # trade-off box
TRADEOFF_BDR  = colors.HexColor('#3B82F6')
TEXT_DARK     = colors.HexColor('#1E293B')
TEXT_MID      = colors.HexColor('#475569')
WHITE         = colors.white
LIGHT_RULE    = colors.HexColor('#CBD5E1')

PAGE_W, PAGE_H = A4


# ─── Custom Flowables ─────────────────────────────────────────────────────────

class HeaderBanner(Flowable):
    """Full-width dark header with title and subtitle."""
    def __init__(self, title, subtitle, series, number):
        super().__init__()
        self.title = title
        self.subtitle = subtitle
        self.series = series
        self.number = number
        self.width = PAGE_W - 4*cm
        self.height = 68*mm

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        # background
        c.setFillColor(DARK_BG)
        c.roundRect(0, 0, w, h, 6, fill=1, stroke=0)
        # accent bar left
        c.setFillColor(ACCENT_BLUE)
        c.rect(0, 0, 5, h, fill=1, stroke=0)
        # article number badge
        c.setFillColor(ACCENT_BLUE)
        c.roundRect(w - 52, h - 32, 42, 22, 4, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont('Helvetica-Bold', 10)
        c.drawCentredString(w - 31, h - 22, f"#{self.number:02d}")
        # series
        c.setFillColor(ACCENT_CYAN)
        c.setFont('Helvetica-Bold', 8)
        c.drawString(16, h - 18, self.series.upper())
        # title
        c.setFillColor(WHITE)
        c.setFont('Helvetica-Bold', 18)
        # wrap title manually
        words = self.title.split()
        line, lines = [], []
        for w_word in words:
            test = ' '.join(line + [w_word])
            if c.stringWidth(test, 'Helvetica-Bold', 18) < (w - 32):
                line.append(w_word)
            else:
                lines.append(' '.join(line))
                line = [w_word]
        lines.append(' '.join(line))
        y = h - 40
        for ln in lines:
            c.drawString(16, y, ln)
            y -= 22
        # subtitle
        c.setFillColor(colors.HexColor('#94A3B8'))
        c.setFont('Helvetica', 11)
        c.drawString(16, 18, self.subtitle)


class ColorBox(Flowable):
    """Colored box with label + body text."""
    def __init__(self, label, body, bg, border, text_color=TEXT_DARK, width=None):
        super().__init__()
        self.label = label
        self.body = body
        self.bg = bg
        self.border = border
        self.text_color = text_color
        self._width = width or (PAGE_W - 4*cm)
        self.height = 0  # will be computed

    def wrap(self, avail_w, avail_h):
        self._width = avail_w
        # estimate height
        char_per_line = int(avail_w / 6.5)
        lines = 1 + len(self.body) // char_per_line
        self.height = max(45, 28 + lines * 14)
        return avail_w, self.height

    def draw(self):
        c = self.canv
        w, h = self._width, self.height
        c.setFillColor(self.bg)
        c.setStrokeColor(self.border)
        c.setLineWidth(1.5)
        c.roundRect(0, 0, w, h, 5, fill=1, stroke=1)
        # label
        c.setFillColor(self.border)
        c.setFont('Helvetica-Bold', 9)
        c.drawString(10, h - 16, f"▶  {self.label}")
        # body
        c.setFillColor(self.text_color)
        c.setFont('Helvetica', 9.5)
        # simple word wrap
        words = self.body.split()
        line, lines, x0, y = [], [], 10, h - 30
        avail = w - 20
        for word in words:
            test = ' '.join(line + [word])
            if c.stringWidth(test, 'Helvetica', 9.5) < avail:
                line.append(word)
            else:
                lines.append(' '.join(line))
                line = [word]
        lines.append(' '.join(line))
        for ln in lines:
            if y < 8:
                break
            c.drawString(x0, y, ln)
            y -= 13


def code_table(snippet):
    """Return a styled code block table."""
    lines = snippet.strip().split('\n')
    data = [[Paragraph(
        f'<font name="Courier" size="8" color="#E2E8F0">{ln.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")}</font>',
        ParagraphStyle('code_line', fontName='Courier', fontSize=8,
                       textColor=CODE_FG, leading=12, leftIndent=0)
    )] for ln in lines]
    t = Table(data, colWidths=[PAGE_W - 4*cm - 4])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CODE_BG),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [CODE_BG]),
        ('ROUNDEDCORNERS', [5]),
    ]))
    return t


# ─── Shared styles ────────────────────────────────────────────────────────────

def make_styles():
    base = getSampleStyleSheet()
    styles = {}
    styles['h1'] = ParagraphStyle('h1', fontName='Helvetica-Bold', fontSize=15,
                                   textColor=ACCENT_BLUE, spaceBefore=14, spaceAfter=4, leading=20)
    styles['h2'] = ParagraphStyle('h2', fontName='Helvetica-Bold', fontSize=12,
                                   textColor=ACCENT_CYAN, spaceBefore=10, spaceAfter=3, leading=16)
    styles['body'] = ParagraphStyle('body', fontName='Helvetica', fontSize=10,
                                     textColor=TEXT_DARK, leading=15, spaceAfter=6,
                                     alignment=TA_JUSTIFY)
    styles['bullet'] = ParagraphStyle('bullet', fontName='Helvetica', fontSize=10,
                                       textColor=TEXT_DARK, leading=14, leftIndent=14,
                                       spaceAfter=3, bulletIndent=4)
    styles['caption'] = ParagraphStyle('caption', fontName='Helvetica-Oblique', fontSize=8.5,
                                        textColor=TEXT_MID, spaceAfter=8, leading=12)
    styles['footer_style'] = ParagraphStyle('footer', fontName='Helvetica', fontSize=8,
                                             textColor=TEXT_MID, leading=10, alignment=TA_CENTER)
    return styles


def footer_cb(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(TEXT_MID)
    canvas.drawCentredString(PAGE_W / 2, 18, f"Backend Architecture Series — Jocoso.cl eCommerce  |  Página {doc.page}")
    canvas.setStrokeColor(LIGHT_RULE)
    canvas.setLineWidth(0.5)
    canvas.line(2*cm, 25, PAGE_W - 2*cm, 25)
    canvas.restoreState()


def build_pdf(filename, story):
    path = os.path.join(OUTPUT_DIR, filename)
    doc = SimpleDocTemplate(
        path, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=1.5*cm, bottomMargin=2*cm,
        title=filename.replace('.pdf', ''),
    )
    doc.build(story, onFirstPage=footer_cb, onLaterPages=footer_cb)
    print(f"  OK  {filename}")


S = make_styles()

def h1(text): return Paragraph(text, S['h1'])
def h2(text): return Paragraph(text, S['h2'])
def body(text): return Paragraph(text, S['body'])
def bullet(text): return Paragraph(f"• {text}", S['bullet'])
def sp(n=6): return Spacer(1, n)
def rule(): return HRFlowable(width='100%', thickness=0.5, color=LIGHT_RULE, spaceAfter=6, spaceBefore=6)
def decision_box(text): return ColorBox("Decisión Técnica", text, DECISION_BG, DECISION_BDR)
def tradeoff_box(text): return ColorBox("Trade-offs", text, TRADEOFF_BG, TRADEOFF_BDR)


# ══════════════════════════════════════════════════════════════════════════════
#  ARTÍCULO 1 — Clean Architecture en NestJS
# ══════════════════════════════════════════════════════════════════════════════

def article_01():
    story = []
    story.append(HeaderBanner(
        "Clean Architecture en NestJS: De módulo gordo a 4 capas independientes",
        "Cómo separar dominio, aplicación, infraestructura e interfaces desde el día 1",
        "Backend Architecture Series — Jocoso.cl eCommerce", 1
    ))
    story.append(sp(14))

    story.append(h1("El problema: el módulo monolítico"))
    story.append(body(
        "Cuando se construye un módulo NestJS típico, la tentación natural es poner todo en "
        "<b>auth.service.ts</b>: validar contraseñas, emitir JWT, consultar la base de datos y "
        "lanzar excepciones HTTP. Este patrón funciona para prototipos, pero en un ecommerce real "
        "que debe integrar múltiples canales (web, MercadoLibre, app móvil) se convierte en un "
        "obstáculo: cualquier cambio de proveedor de BD o de librería JWT rompe la lógica de negocio."
    ))
    story.append(sp(4))

    story.append(h1("La decisión arquitectónica"))
    story.append(decision_box(
        "Adoptar Clean Architecture + DDD: el dominio no depende de nada externo. "
        "Cada bounded context (auth, stock, payments) tiene sus propias 4 capas: "
        "domain / application / infrastructure / interfaces."
    ))
    story.append(sp(8))

    story.append(h1("Las 4 capas explicadas"))
    story.append(h2("1. Domain — el núcleo del negocio"))
    story.append(body(
        "Contiene entidades con lógica de negocio pura, interfaces de repositorio (contratos) "
        "y servicios de dominio. No importa ningún framework ni librería externa. "
        "Una entidad User con constructor privado y factory method:"
    ))
    story.append(code_table(
        "// domain/auth/entities/user.entity.ts\n"
        "export class User {\n"
        "  private constructor(private props: UserProps) {}\n\n"
        "  static create(email: string, passwordHash: string): User {\n"
        "    return new User({\n"
        "      id: crypto.randomUUID(),\n"
        "      email,\n"
        "      passwordHash,\n"
        "      role: Role.CUSTOMER,\n"
        "      isActive: true,\n"
        "      twoFactorEnabled: false,\n"
        "    });\n"
        "  }\n\n"
        "  static reconstitute(props: UserProps): User {\n"
        "    return new User(props);\n"
        "  }\n"
        "}"
    ))
    story.append(sp(6))

    story.append(h2("2. Application — casos de uso"))
    story.append(body(
        "Orquesta el flujo de negocio sin conocer Prisma, Express ni NestJS. "
        "Solo habla con interfaces del dominio mediante inyección de dependencias por tokens:"
    ))
    story.append(code_table(
        "// application/auth/use-cases/register.usecase.ts\n"
        "@Injectable()\n"
        "export class RegisterUseCase {\n"
        "  constructor(\n"
        "    @Inject(USER_REPOSITORY)\n"
        "    private readonly users: IUserRepository,\n"
        "    private readonly bcrypt: BcryptService,\n"
        "  ) {}\n\n"
        "  async execute(dto: RegisterDto): Promise<void> {\n"
        "    const exists = await this.users.findByEmail(dto.email);\n"
        "    if (exists) throw new ConflictException('Email ya registrado');\n"
        "    const hash = await this.bcrypt.hash(dto.password);\n"
        "    await this.users.save(User.create(dto.email, hash));\n"
        "  }\n"
        "}"
    ))
    story.append(sp(6))

    story.append(h2("3. Infrastructure — adaptadores concretos"))
    story.append(body(
        "Implementa los contratos del dominio con tecnologías reales: Prisma, JWT, bcrypt, speakeasy. "
        "Si mañana migramos de Prisma a otro ORM, solo cambia esta capa."
    ))
    story.append(code_table(
        "// infrastructure/auth/user.prisma-repo.ts\n"
        "@Injectable()\n"
        "export class UserPrismaRepository implements IUserRepository {\n"
        "  constructor(private readonly prisma: PrismaService) {}\n\n"
        "  async findByEmail(email: string): Promise<User | null> {\n"
        "    const row = await this.prisma.user.findUnique({ where: { email } });\n"
        "    return row ? User.reconstitute(row as UserProps) : null;\n"
        "  }\n"
        "}"
    ))
    story.append(sp(6))

    story.append(h2("4. Interfaces — controladores HTTP"))
    story.append(body(
        "Reciben la request, delegan al caso de uso y retornan la respuesta. "
        "Cero lógica de negocio — son traductores entre HTTP y Application."
    ))
    story.append(code_table(
        "// interfaces/http/auth/auth.controller.ts\n"
        "@Controller('auth')\n"
        "export class AuthController {\n"
        "  constructor(private readonly register: RegisterUseCase) {}\n\n"
        "  @Post('register')\n"
        "  async registerUser(@Body() dto: RegisterDto) {\n"
        "    return this.register.execute(dto);\n"
        "  }\n"
        "}"
    ))
    story.append(sp(8))

    story.append(h1("El módulo como pure wiring"))
    story.append(body(
        "El módulo NestJS no contiene ninguna lógica — solo conecta tokens con implementaciones:"
    ))
    story.append(code_table(
        "// modules/auth/auth.module.ts\n"
        "@Module({\n"
        "  providers: [\n"
        "    RegisterUseCase, LoginUseCase, RefreshUseCase,\n"
        "    { provide: USER_REPOSITORY,          useClass: UserPrismaRepository },\n"
        "    { provide: REFRESH_TOKEN_REPOSITORY, useClass: RefreshTokenPrismaRepository },\n"
        "    { provide: TOKEN_SERVICE,            useClass: JwtTokenService },\n"
        "  ],\n"
        "  controllers: [AuthController],\n"
        "})\n"
        "export class AuthModule {}"
    ))
    story.append(sp(8))

    story.append(h1("La regla de dependencias"))
    story.append(body(
        "<b>Domain</b> no importa nada externo. "
        "<b>Application</b> solo conoce Domain. "
        "<b>Infrastructure</b> implementa contratos de Domain. "
        "<b>Interfaces</b> delega a Application. "
        "Esta regla se valida por convención en TypeScript: si un archivo en <i>domain/</i> "
        "importa desde <i>infrastructure/</i>, el PR falla en code review."
    ))
    story.append(sp(8))

    story.append(tradeoff_box(
        "MÁS archivos y carpetas vs SEPARACIÓN real de concerns. "
        "El overhead inicial es alto (~30% más archivos), pero en un ecommerce que escala "
        "a múltiples canales la inversión se recupera: el dominio se prueba sin Prisma, "
        "sin NestJS, sin base de datos. Los tests son 10x más rápidos y el código sobrevive "
        "migraciones de infraestructura sin tocar la lógica de negocio."
    ))
    story.append(sp(10))

    story.append(h1("Conclusión"))
    story.append(body(
        "Esta arquitectura prepara el sistema para microservicios: si mañana separamos "
        "auth en su propio servicio, el dominio se extrae sin cambios. La inversión en "
        "estructura paga dividendos cuando el equipo crece o cuando MercadoLibre exige "
        "integraciones que no imaginábamos al inicio."
    ))

    build_pdf("01-clean-architecture-nestjs.pdf", story)


# ══════════════════════════════════════════════════════════════════════════════
#  ARTÍCULO 2 — JWT, Refresh Tokens y 2FA
# ══════════════════════════════════════════════════════════════════════════════

def article_02():
    story = []
    story.append(HeaderBanner(
        "JWT, Refresh Tokens y 2FA: Seguridad real desde el día 1",
        "Access tokens cortos, rotación de refresh tokens y TOTP para un ecommerce multicanal",
        "Backend Architecture Series — Jocoso.cl eCommerce", 2
    ))
    story.append(sp(14))

    story.append(h1("La seguridad no puede ser un afterthought"))
    story.append(body(
        "En un ecommerce las consecuencias de una brecha son directas: cuentas comprometidas, "
        "pedidos fraudulentos, datos de tarjetas en riesgo. Diseñar la seguridad desde el día 1 "
        "no solo protege a los usuarios — protege la reputación del negocio y el cumplimiento "
        "regulatorio requerido por pasarelas como MercadoPago."
    ))
    story.append(sp(4))

    story.append(h1("Arquitectura de tokens dual"))
    story.append(decision_box(
        "Access Token (JWT, 15 min) + Refresh Token rotado (7 días, SHA-256 hasheado en BD). "
        "Los 15 minutos minimizan la ventana de exposición si el token es interceptado. "
        "El refresh token nunca se guarda en texto plano — solo su hash SHA-256."
    ))
    story.append(sp(8))

    story.append(h2("Refresh Token Rotation — detección de robo"))
    story.append(body(
        "Cada uso del refresh token invalida el token anterior y genera uno nuevo. "
        "Si un atacante roba el token y lo usa antes que el usuario legítimo, "
        "el segundo intento de uso detecta la colisión y revoca toda la sesión:"
    ))
    story.append(code_table(
        "// application/auth/use-cases/refresh.usecase.ts\n"
        "async execute(rawToken: string): Promise<TokenPair> {\n"
        "  const hash = this.tokenSvc.hashToken(rawToken);  // SHA-256\n"
        "  const record = await this.refreshRepo.findByHash(hash);\n\n"
        "  if (!record || record.isRevoked || record.expiresAt < new Date()) {\n"
        "    throw new UnauthorizedException('Token inválido o expirado');\n"
        "  }\n\n"
        "  // Rotation: revoke old, issue new\n"
        "  await this.refreshRepo.revoke(record.id);\n"
        "  const newRaw   = this.tokenSvc.generateRefreshToken();\n"
        "  const newHash  = this.tokenSvc.hashToken(newRaw);\n"
        "  await this.refreshRepo.save({ userId: record.userId, hash: newHash, ... });\n\n"
        "  return { accessToken: this.tokenSvc.generateAccessToken(user), refreshToken: newRaw };\n"
        "}"
    ))
    story.append(sp(8))

    story.append(h1("RBAC — Control de acceso basado en roles"))
    story.append(body(
        "El sistema maneja tres roles: ADMIN, SELLER y CUSTOMER. "
        "La autorización se implementa con un decorador declarativo y un guard que "
        "lee el payload del JWT:"
    ))
    story.append(code_table(
        "// infrastructure/security/guards/roles.guard.ts\n"
        "@Injectable()\n"
        "export class RolesGuard implements CanActivate {\n"
        "  constructor(private reflector: Reflector) {}\n\n"
        "  canActivate(ctx: ExecutionContext): boolean {\n"
        "    const roles = this.reflector.get<Role[]>('roles', ctx.getHandler());\n"
        "    if (!roles?.length) return true;\n"
        "    const { user } = ctx.switchToHttp().getRequest();\n"
        "    return roles.includes(user.role);\n"
        "  }\n"
        "}\n\n"
        "// Uso en controlador:\n"
        "@Get('admin/users')\n"
        "@UseGuards(JwtAuthGuard, RolesGuard)\n"
        "@Roles(Role.ADMIN)\n"
        "listUsers() { ... }"
    ))
    story.append(sp(8))

    story.append(h1("2FA con TOTP — Google Authenticator"))
    story.append(body(
        "La autenticación de dos factores usa TOTP (Time-based One-Time Password) "
        "compatible con Google Authenticator y Authy. El flujo tiene tres pasos:"
    ))
    story.append(bullet("Setup: el servidor genera un secreto con speakeasy y retorna QR code URI"))
    story.append(bullet("Verify: el usuario ingresa el código de 6 dígitos para confirmar el setup"))
    story.append(bullet("Login: si 2FA está habilitado, el login requiere el código TOTP además de contraseña"))
    story.append(sp(4))
    story.append(code_table(
        "// infrastructure/security/totp.service.ts\n"
        "@Injectable()\n"
        "export class TotpService {\n"
        "  generateSecret(email: string) {\n"
        "    const secret = speakeasy.generateSecret({\n"
        "      name: `Jocoso.cl (${email})`,\n"
        "      issuer: 'Jocoso.cl',\n"
        "    });\n"
        "    return { secret: secret.base32, otpauthUrl: secret.otpauth_url };\n"
        "  }\n\n"
        "  verify(secret: string, token: string): boolean {\n"
        "    return speakeasy.totp.verify({\n"
        "      secret, encoding: 'base32', token, window: 1,\n"
        "    });\n"
        "  }\n"
        "}"
    ))
    story.append(sp(8))

    story.append(h1("bcrypt con 12 rounds"))
    story.append(body(
        "Las contraseñas se hashean con bcrypt usando 12 rondas. En hardware moderno, "
        "12 rondas toma ~250ms — suficiente para que ataques de fuerza bruta sean prohibitivamente "
        "lentos, sin degradar la experiencia del usuario en login."
    ))
    story.append(sp(4))

    story.append(h1("Hardening de la API"))
    story.append(bullet("Helmet: configura headers HTTP de seguridad (CSP, HSTS, X-Frame-Options)"))
    story.append(bullet("CORS restrictivo: solo orígenes permitidos en lista blanca"))
    story.append(bullet("ValidationPipe global: whitelist + transform — rechaza campos no declarados en DTOs"))
    story.append(bullet("class-validator en todos los DTOs: IsEmail, IsStrongPassword, IsJWT"))
    story.append(sp(8))

    story.append(tradeoff_box(
        "JWT stateless vs Sessions con estado. JWT permite escalar horizontalmente sin store "
        "compartido — clave para preparar microservicios. La contrapartida es que la revocación "
        "inmediata requiere una lista negra en Redis. Para Jocoso.cl la solución es access tokens "
        "cortos (15 min): el impacto de un token robado está acotado al tiempo de expiración. "
        "Refresh tokens sí se revocan en BD en logout y en rotación."
    ))
    story.append(sp(10))

    story.append(h1("Conclusión"))
    story.append(body(
        "La seguridad de un ecommerce no es un feature adicional — es la base que permite operar. "
        "Este diseño cubre las tres dimensiones: autenticación robusta (JWT + refresh rotation), "
        "autorización granular (RBAC) y segundo factor (TOTP). Todo implementado en la capa de "
        "infraestructura, invisible para el dominio."
    ))

    build_pdf("02-jwt-auth-2fa.pdf", story)


# ══════════════════════════════════════════════════════════════════════════════
#  ARTÍCULO 3 — Stock y SELECT FOR UPDATE
# ══════════════════════════════════════════════════════════════════════════════

def article_03():
    story = []
    story.append(HeaderBanner(
        "Stock en ecommerce: SELECT FOR UPDATE y transacciones serializables con Prisma",
        "Cómo evitar race conditions y mantener trazabilidad completa con StockMovement",
        "Backend Architecture Series — Jocoso.cl eCommerce", 3
    ))
    story.append(sp(14))

    story.append(h1("El problema: race conditions en stock"))
    story.append(body(
        "Imagina dos usuarios comprando el último par de tallas simultáneamente. "
        "Con una implementación naive de <i>SELECT + UPDATE</i> separados, ambas transacciones "
        "leen stock = 1, validan OK, y ambas decrementan — el stock queda en -1. "
        "Este escenario no es teórico: en el Black Friday de cualquier ecommerce latinoamericano "
        "la concurrencia real lo hace inevitable."
    ))
    story.append(sp(4))

    story.append(decision_box(
        "Usar $transaction con isolationLevel: 'Serializable' + SELECT FOR UPDATE via $queryRaw. "
        "Prisma ORM no expone SELECT FOR UPDATE nativamente — se necesitan raw queries "
        "dentro de la transacción administrada."
    ))
    story.append(sp(8))

    story.append(h1("La regla de oro: stock solo mediante movimientos"))
    story.append(body(
        "El campo <b>ProductVariant.stock</b> nunca se modifica directamente desde la aplicación. "
        "Cada cambio de stock — venta, reposición, ajuste manual, devolución — pasa por un "
        "<b>StockMovement</b>. Esto garantiza auditoría completa: siempre se puede reconstruir "
        "el stock histórico sumando los movimientos."
    ))
    story.append(sp(4))

    story.append(h2("Modelo StockMovement"))
    story.append(code_table(
        "model StockMovement {\n"
        "  id            String        @id @default(uuid())\n"
        "  variantId     String\n"
        "  quantity      Int           // positivo = entrada, negativo = salida\n"
        "  source        StockSource   // ORDER | MANUAL | RETURN | ML_SALE\n"
        "  referenceType ReferenceType // ORDER | PAYMENT | MANUAL_ADJUSTMENT\n"
        "  referenceId   String\n"
        "  externalId    String        @unique  // idempotencia (webhooks ML)\n"
        "  userId        String?       // quién ejecutó el movimiento\n"
        "  createdAt     DateTime      @default(now())\n"
        "}"
    ))
    story.append(sp(8))

    story.append(h1("El código real: SELECT FOR UPDATE"))
    story.append(code_table(
        "// infrastructure/stock/stock.prisma-repo.ts\n"
        "async decreaseWithLock(\n"
        "  variantId: string,\n"
        "  amount: number,\n"
        "  movement: StockMovement,\n"
        "): Promise<void> {\n"
        "  await this.prisma.$transaction(\n"
        "    async (tx) => {\n"
        "      // 1. Adquirir lock exclusivo sobre la fila\n"
        "      const rows = await tx.$queryRaw<VariantStockRow[]>`\n"
        "        SELECT stock FROM product_variants\n"
        "        WHERE id = ${variantId} FOR UPDATE\n"
        "      `;\n"
        "      if (!rows.length) throw new NotFoundException('Variante no encontrada');\n"
        "      const current = rows[0].stock;\n\n"
        "      // 2. Validar en dominio\n"
        "      if (current < amount) {\n"
        "        throw new BadRequestException('Stock insuficiente');\n"
        "      }\n\n"
        "      // 3. Decrementar y registrar movimiento atómicamente\n"
        "      await tx.$executeRaw`\n"
        "        UPDATE product_variants\n"
        "        SET stock = stock - ${amount}, updated_at = NOW()\n"
        "        WHERE id = ${variantId}\n"
        "      `;\n"
        "      await tx.stockMovement.create({ data: movement.toPersistence() });\n"
        "    },\n"
        "    { isolationLevel: 'Serializable' },\n"
        "  );\n"
        "}"
    ))
    story.append(sp(8))

    story.append(h1("Por qué Prisma ORM no es suficiente"))
    story.append(body(
        "Prisma expone <i>$transaction()</i> para operaciones atómicas, pero no tiene una API "
        "de alto nivel para <i>SELECT FOR UPDATE</i>. La solución es usar <b>$queryRaw</b> "
        "dentro de la transacción: el cliente Prisma administra la conexión y el isolation level, "
        "mientras la query SQL garantiza el bloqueo a nivel de fila. Esta decisión se documentó "
        "explícitamente para que futuros desarrolladores entiendan por qué existen raw queries "
        "en un proyecto que usa ORM."
    ))
    story.append(sp(8))

    story.append(h1("Idempotencia con externalId"))
    story.append(body(
        "MercadoLibre (y cualquier webhook externo) puede enviar la misma notificación "
        "múltiples veces. El campo <b>externalId @unique</b> en StockMovement garantiza "
        "que un doble webhook no decremente el stock dos veces:"
    ))
    story.append(code_table(
        "// Si el movimiento ya existe, Prisma lanza Unique Constraint Violation\n"
        "// El use case lo captura y retorna 200 OK (idempotente)\n"
        "try {\n"
        "  await this.stockRepo.decreaseWithLock(variantId, qty, movement);\n"
        "} catch (e) {\n"
        "  if (isUniqueConstraintViolation(e)) return; // ya procesado\n"
        "  throw e;\n"
        "}"
    ))
    story.append(sp(8))

    story.append(h1("Dominio puro: Stock entity y StockDomainService"))
    story.append(body(
        "La lógica de validación vive en el dominio, no en la infraestructura. "
        "La entidad <b>Stock</b> y su servicio de dominio encapsulan las reglas de negocio:"
    ))
    story.append(bullet("stock nunca negativo — enforced en dominio Y en constraint de BD"))
    story.append(bullet("canDecrease(amount): lanza DomainException si stock < amount"))
    story.append(bullet("StockDomainService.validateDecrease() coordina entidad + reglas de negocio"))
    story.append(sp(8))

    story.append(tradeoff_box(
        "Serializable isolation vs Read Committed. Serializable previene todos los fenómenos "
        "de concurrencia (dirty reads, non-repeatable reads, phantom reads) pero tiene mayor "
        "overhead por gestión de conflictos. Para operaciones de stock la corrección prima "
        "sobre el throughput: un ecommerce prefiere rechazar una venta antes que vender "
        "stock inexistente."
    ))
    story.append(sp(10))

    story.append(h1("Trazabilidad con source + referenceType"))
    story.append(body(
        "Cada StockMovement registra quién, por qué y desde dónde. "
        "Al integrar con MercadoLibre, las ventas desde ML se crean con "
        "<b>source: ML_SALE</b> y <b>referenceType: ORDER</b>, "
        "distinguiéndolas de ventas directas en el canal web. "
        "Esto permite auditorías, reconciliaciones contables y análisis de canal por canal."
    ))

    build_pdf("03-stock-management-for-update.pdf", story)


# ══════════════════════════════════════════════════════════════════════════════
#  ARTÍCULO 4 — Payment State Machine
# ══════════════════════════════════════════════════════════════════════════════

def article_04():
    story = []
    story.append(HeaderBanner(
        "Payment State Machine: Cómo modelar pagos que no mienten",
        "FSM en el dominio, transacciones atómicas y auditoría completa con PaymentEventLog",
        "Backend Architecture Series — Jocoso.cl eCommerce", 4
    ))
    story.append(sp(14))

    story.append(h1("Los pagos son la parte más crítica"))
    story.append(body(
        "Un bug en el módulo de stock puede generar un pedido sin stock. "
        "Un bug en pagos puede cobrar dos veces, no cobrar nunca, o confirmar un pedido "
        "con pago rechazado. Los pagos son dinero real — cada línea de código tiene consecuencias "
        "directas para el negocio y para la confianza del cliente."
    ))
    story.append(sp(4))

    story.append(decision_box(
        "Modelar los pagos como una Finite State Machine (FSM) en el dominio. "
        "Cualquier transición inválida lanza una excepción en dominio antes de tocar la BD. "
        "Cada cambio de estado queda registrado en PaymentEventLog con fromStatus, toStatus, "
        "triggeredBy y payload."
    ))
    story.append(sp(8))

    story.append(h1("Los estados y transiciones"))
    story.append(body(
        "La FSM define explícitamente qué transiciones son legales. "
        "No hay <i>if/else</i> dispersos por el código — hay una tabla de transiciones:"
    ))
    story.append(code_table(
        "// domain/payments/entities/payment.entity.ts\n"
        "export enum PaymentStatus {\n"
        "  PENDING   = 'PENDING',\n"
        "  APPROVED  = 'APPROVED',\n"
        "  REJECTED  = 'REJECTED',\n"
        "  CANCELLED = 'CANCELLED',\n"
        "  SETTLED   = 'SETTLED',\n"
        "}\n\n"
        "const TRANSITIONS: Partial<Record<PaymentStatus, PaymentStatus[]>> = {\n"
        "  [PaymentStatus.PENDING]:  [APPROVED, REJECTED, CANCELLED],\n"
        "  [PaymentStatus.APPROVED]: [SETTLED],\n"
        "};\n\n"
        "private transition(next: PaymentStatus): void {\n"
        "  const allowed = TRANSITIONS[this.status] ?? [];\n"
        "  if (!allowed.includes(next)) {\n"
        "    throw new Error(\n"
        "      `Transición inválida: ${this.status} -> ${next}`\n"
        "    );\n"
        "  }\n"
        "  this.status = next;\n"
        "  this.touch();\n"
        "}"
    ))
    story.append(sp(8))

    story.append(h1("PaymentEventLog — auditoría inmutable"))
    story.append(body(
        "Cada transición genera un registro de auditoría. El log es append-only: "
        "nunca se modifica ni elimina. Esto permite reconstruir el historial completo "
        "de cualquier pago para disputas, debugging y reportes regulatorios:"
    ))
    story.append(code_table(
        "// domain/payments/entities/payment-event-log.entity.ts\n"
        "export class PaymentEventLog {\n"
        "  private constructor(private props: PaymentEventLogProps) {}\n\n"
        "  static create(\n"
        "    paymentId: string,\n"
        "    fromStatus: PaymentStatus,\n"
        "    toStatus: PaymentStatus,\n"
        "    triggeredBy: string,    // 'webhook' | 'user:uuid' | 'system'\n"
        "    payload?: object,       // raw webhook response\n"
        "  ): PaymentEventLog {\n"
        "    return new PaymentEventLog({\n"
        "      id: crypto.randomUUID(),\n"
        "      paymentId, fromStatus, toStatus, triggeredBy,\n"
        "      payload: payload ? JSON.stringify(payload) : null,\n"
        "    });\n"
        "  }\n"
        "}"
    ))
    story.append(sp(8))

    story.append(h1("La operación atómica en infraestructura"))
    story.append(body(
        "Actualizar el estado del pago e insertar el evento de auditoría ocurre en "
        "una sola transacción de base de datos. Si cualquiera falla, ambas operaciones "
        "se revierten — nunca queda el estado actualizado sin el log, ni el log sin el estado:"
    ))
    story.append(code_table(
        "// infrastructure/payments/payment.prisma-repo.ts\n"
        "async update(payment: Payment, eventLog: PaymentEventLog): Promise<void> {\n"
        "  const d = payment.toPersistence();\n"
        "  const log = eventLog.toPersistence();\n\n"
        "  await this.prisma.$transaction([\n"
        "    this.prisma.payment.update({\n"
        "      where: { id: d.id },\n"
        "      data: { status: d.status as any, gatewayId: d.gatewayId },\n"
        "    }),\n"
        "    this.prisma.paymentEventLog.create({\n"
        "      data: {\n"
        "        id: log.id, paymentId: log.paymentId,\n"
        "        fromStatus: log.fromStatus as any,\n"
        "        toStatus: log.toStatus as any,\n"
        "        triggeredBy: log.triggeredBy,\n"
        "        payload: log.payload ?? undefined,\n"
        "      },\n"
        "    }),\n"
        "  ]);\n"
        "}"
    ))
    story.append(sp(8))

    story.append(h1("Webhook handling e idempotencia"))
    story.append(body(
        "MercadoPago envía webhooks con el resultado del pago. Los webhooks pueden llegar "
        "duplicados — el mismo pago puede notificarse dos o tres veces. El HandleWebhookUseCase "
        "maneja esto: si el pago ya tiene el estado final, la transición falla en dominio "
        "(transición inválida) y el endpoint responde 200 OK sin procesar dos veces:"
    ))
    story.append(code_table(
        "// application/payments/use-cases/handle-webhook.usecase.ts\n"
        "async execute(dto: WebhookPayload): Promise<void> {\n"
        "  const payment = await this.paymentRepo.findById(dto.paymentId);\n"
        "  if (!payment) throw new NotFoundException();\n\n"
        "  if (dto.status === 'approved') {\n"
        "    await this.approve.execute(payment.getId(), dto.gatewayId, dto.raw);\n"
        "  } else if (dto.status === 'rejected') {\n"
        "    await this.reject.execute(payment.getId(), dto.gatewayId, dto.raw);\n"
        "  }\n"
        "}"
    ))
    story.append(sp(8))

    story.append(h1("La cascada: pago aprobado dispara el negocio"))
    story.append(body(
        "Cuando un pago se aprueba, el ApprovePaymentUseCase actualiza el estado del pago "
        "Y confirma la orden asociada. La confirmación de la orden es el disparador para "
        "el decremento de stock. Esta cascada garantiza que el stock solo se decrementa "
        "cuando hay dinero real confirmado."
    ))
    story.append(bullet("Webhook aprobado → ApprovePaymentUseCase"))
    story.append(bullet("ApprovePaymentUseCase → ConfirmOrderUseCase"))
    story.append(bullet("ConfirmOrderUseCase → DecreaseStockUseCase (FOR UPDATE)"))
    story.append(sp(8))

    story.append(tradeoff_box(
        "Event Sourcing completo vs PaymentEventLog (event sourcing light). "
        "Event sourcing completo requiere reconstruir estado desde eventos — poderoso "
        "pero complejo. PaymentEventLog es un compromiso: guardamos los eventos como "
        "auditoría pero mantenemos el estado actual en el registro principal. "
        "Cubre el 95% de los casos de uso (auditoría, debugging, disputas) con "
        "30% de la complejidad de event sourcing completo."
    ))

    build_pdf("04-payment-state-machine.pdf", story)


# ══════════════════════════════════════════════════════════════════════════════
#  ARTÍCULO 5 — Integración MercadoLibre
# ══════════════════════════════════════════════════════════════════════════════

def article_05():
    story = []
    story.append(HeaderBanner(
        "Integrando con MercadoLibre: Arquitectura para no depender de un gigante",
        "148M usuarios activos, un solo modelo de dominio. ML como canal, no como fuente de verdad.",
        "Backend Architecture Series — Jocoso.cl eCommerce", 5
    ))
    story.append(sp(14))

    story.append(h1("MercadoLibre: la oportunidad y el riesgo"))
    story.append(body(
        "MercadoLibre es el marketplace más grande de Latinoamérica con más de 148 millones "
        "de usuarios activos. Para un ecommerce en Chile, publicar en ML significa acceso "
        "inmediato a millones de compradores. El riesgo: muchos sistemas construyen su "
        "arquitectura alrededor de ML, convirtiendo al gigante en su fuente de verdad. "
        "Cuando ML cambia su API, el negocio queda paralizado."
    ))
    story.append(sp(4))

    story.append(decision_box(
        "ML es un canal de venta, no la fuente de verdad. "
        "Jocoso.cl es la fuente de verdad. ML recibe datos desde Jocoso.cl, "
        "nunca al revés. Un producto existe en el sistema antes de publicarse en ML. "
        "El stock se gestiona en Jocoso.cl y se sincroniza hacia ML."
    ))
    story.append(sp(8))

    story.append(h1("El modelo de datos: puentes hacia ML"))
    story.append(body(
        "Los identificadores de MercadoLibre se almacenan como campos opcionales en los "
        "modelos existentes. Un producto puede existir sin estar publicado en ML:"
    ))
    story.append(code_table(
        "model Product {\n"
        "  id        String  @id @default(uuid())\n"
        "  name      String\n"
        "  mlItemId  String? // null = no publicado en ML\n"
        "  // ... otros campos\n"
        "}\n\n"
        "model ProductVariant {\n"
        "  id             String  @id @default(uuid())\n"
        "  productId      String\n"
        "  stock          Int     @default(0)\n"
        "  mlVariationId  String? // null = variante no sincronizada\n"
        "  // ... otros campos\n"
        "}\n\n"
        "-- Índices parciales: unicidad SOLO cuando el campo está presente\n"
        "CREATE UNIQUE INDEX unique_ml_item_id\n"
        "  ON products (mlItemId) WHERE mlItemId IS NOT NULL;\n\n"
        "CREATE UNIQUE INDEX unique_ml_variation_id\n"
        "  ON product_variants (mlVariationId) WHERE mlVariationId IS NOT NULL;"
    ))
    story.append(sp(8))

    story.append(h1("Por qué índices parciales y no @unique simple"))
    story.append(body(
        "Un índice <b>@unique</b> simple en un campo nullable en PostgreSQL ya permite "
        "múltiples NULLs (NULL != NULL en SQL), pero usar un índice parcial es la solución "
        "correcta y explícita: comunica la intención de negocio al equipo, "
        "y permite agregar validaciones adicionales a nivel de índice en el futuro "
        "sin migración destructiva."
    ))
    story.append(sp(4))

    story.append(h2("Consistencia lógica: regla mlVariationId → mlItemId"))
    story.append(body(
        "Si una variante tiene mlVariationId, su producto padre debe tener mlItemId. "
        "Una variante no puede estar en ML si su producto no está publicado. "
        "Esta regla se enforcea en la capa de dominio:"
    ))
    story.append(code_table(
        "// domain/products/services/product.domain.service.ts\n"
        "validateMlMapping(product: Product, variant: ProductVariant): void {\n"
        "  if (variant.getMlVariationId() && !product.getMlItemId()) {\n"
        "    throw new DomainException(\n"
        "      'Una variante no puede tener mlVariationId sin que el producto tenga mlItemId'\n"
        "    );\n"
        "  }\n"
        "}"
    ))
    story.append(sp(8))

    story.append(h1("Sincronización de stock: Jocoso.cl → ML"))
    story.append(body(
        "Cuando el stock cambia en Jocoso.cl (venta, ajuste, devolución), "
        "un job asíncrono con BullMQ sincroniza el nuevo stock hacia ML. "
        "El diseño es asíncrono por diseño: si ML tiene latencia o falla, "
        "las ventas en el canal web siguen funcionando sin interrupción."
    ))
    story.append(code_table(
        "// Flujo de sincronización\n"
        "1. StockMovement creado (canal web)\n"
        "   ↓\n"
        "2. SyncStockToMLJob encolado en BullMQ\n"
        "   ↓\n"
        "3. Worker llama PUT /items/{mlItemId}/variations/{mlVariationId}\n"
        "     con el nuevo stock\n"
        "   ↓\n"
        "4. Si ML falla → retry exponencial (3 intentos, backoff 2^n seg)\n"
        "5. Si ML sigue fallando → alerta pero canal web no se interrumpe"
    ))
    story.append(sp(8))

    story.append(h1("Ventas desde ML: webhook → dominio"))
    story.append(body(
        "Cuando un usuario compra en MercadoLibre, ML notifica via webhook. "
        "La arquitectura procesa la venta como cualquier otra — sin tratamiento especial:"
    ))
    story.append(code_table(
        "// Flujo de venta desde ML\n"
        "1. Webhook ML: { orderId, items: [{ mlVariationId, qty }] }\n"
        "   ↓\n"
        "2. MLOrderWebhookHandler busca variant por mlVariationId\n"
        "   ↓\n"
        "3. CreateOrder + DecreaseStock (FOR UPDATE, idempotente con externalId)\n"
        "   ↓\n"
        "4. StockMovement con source: 'ML_SALE', referenceType: 'ORDER'\n"
        "   ↓\n"
        "5. Si externalId ya existe → 200 OK sin procesar (idempotencia)"
    ))
    story.append(sp(8))

    story.append(h1("OAuth2 de ML: tokens que expiran"))
    story.append(body(
        "La API de MercadoLibre usa OAuth2 con access tokens que expiran cada 6 horas. "
        "El sistema mantiene el access token y refresh token de ML en BD, "
        "y un interceptor HTTP los renueva automáticamente antes de cada request:"
    ))
    story.append(bullet("Access token ML almacenado cifrado en BD (AES-256)"))
    story.append(bullet("Refresh automático si el token expira en menos de 30 minutos"))
    story.append(bullet("Retry automático del request original tras renovar token"))
    story.append(sp(8))

    story.append(h1("La resiliencia como principio de diseño"))
    story.append(body(
        "El sistema está diseñado para funcionar aunque ML esté caído. "
        "Las ventas web procesan sin depender de la API de ML. "
        "La sincronización es eventual — cuando ML vuelve, el job reintenta. "
        "Esta decisión protege el negocio: MercadoLibre tuvo 6 incidentes mayores en 2024, "
        "y en cada uno los comercios con arquitecturas acopladas perdieron ventas."
    ))
    story.append(sp(8))

    story.append(tradeoff_box(
        "Sincronización eventual vs consistencia fuerte con ML. "
        "Con sincronización eventual existe una ventana donde el stock en ML puede estar "
        "desactualizado (segundos/minutos en condiciones normales). La alternativa — bloquear "
        "la venta web hasta confirmar sync con ML — crea un punto de falla externo. "
        "El trade-off elegido: preferir disponibilidad del canal propio sobre consistencia "
        "inmediata con el canal externo. El riesgo de overselling es mitigado por el retry "
        "rápido y monitoreo activo."
    ))
    story.append(sp(10))

    story.append(h1("Extensibilidad: de ML a cualquier marketplace"))
    story.append(body(
        "El diseño con campos opcionales y jobs de sincronización aplica igual a "
        "Amazon Marketplace, Falabella, Paris o cualquier canal futuro. "
        "Para agregar un nuevo marketplace, solo se necesita:"
    ))
    story.append(bullet("Agregar campos opcionales en Product/Variant (amazonAsin, falabellaId, etc.)"))
    story.append(bullet("Implementar el cliente HTTP del nuevo marketplace"))
    story.append(bullet("Agregar el job de sincronización correspondiente"))
    story.append(bullet("El dominio, la lógica de stock y los pagos no se modifican"))
    story.append(sp(8))

    story.append(h1("Conclusión"))
    story.append(body(
        "Integrar con MercadoLibre no es difícil. Integrar con ML de forma que tu negocio "
        "no dependa de su disponibilidad, que tu modelo de dominio no se contamine con "
        "sus conceptos, y que puedas agregar otros marketplaces sin refactoring — eso "
        "requiere arquitectura. Jocoso.cl trata a ML como lo que es: un canal de distribución "
        "poderoso, no una fuente de verdad."
    ))

    build_pdf("05-mercadolibre-integration-architecture.pdf", story)


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    print("Generando artículos PDF...")
    article_01()
    article_02()
    article_03()
    article_04()
    article_05()
    print("\nTodos los PDFs generados en:", OUTPUT_DIR)
