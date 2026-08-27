import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, ParseUUIDPipe, ValidationPipe, Header,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { RolesGuard } from '../../../infrastructure/security/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../../domain/auth/entities/user.entity';
import { CreateConcursoUseCase } from '../../../application/concursos/use-cases/create-concurso.usecase';
import { UpdateConcursoUseCase } from '../../../application/concursos/use-cases/update-concurso.usecase';
import { ChangeEstadoConcursoUseCase } from '../../../application/concursos/use-cases/change-estado-concurso.usecase';
import { DrawWinnerUseCase } from '../../../application/concursos/use-cases/draw-winner.usecase';
import { ListConcursosUseCase } from '../../../application/concursos/use-cases/list-concursos.usecase';
import { GetConcursoUseCase } from '../../../application/concursos/use-cases/get-concurso.usecase';
import { ListParticipantesUseCase } from '../../../application/concursos/use-cases/list-participantes.usecase';
import { SyncParticipacionesUseCase } from '../../../application/concursos/use-cases/sync-participaciones.usecase';
import { GetPromoConcursoUseCase } from '../../../application/concursos/use-cases/get-promo-concurso.usecase';
import { CreateConcursoDto } from './dto/create-concurso.dto';
import { UpdateConcursoDto } from './dto/update-concurso.dto';
import { ChangeEstadoDto } from './dto/change-estado.dto';
import { buildPublicPageHtml } from './concurso-public-page.template';

@ApiTags('concursos')
@Controller('concursos')
export class ConcursosController {
  constructor(
    private readonly createConcurso: CreateConcursoUseCase,
    private readonly updateConcurso: UpdateConcursoUseCase,
    private readonly changeEstado: ChangeEstadoConcursoUseCase,
    private readonly drawWinner: DrawWinnerUseCase,
    private readonly listConcursos: ListConcursosUseCase,
    private readonly getConcurso: GetConcursoUseCase,
    private readonly listParticipantes: ListParticipantesUseCase,
    private readonly syncParticipaciones: SyncParticipacionesUseCase,
    private readonly getPromo: GetPromoConcursoUseCase,
  ) {}

  // ── Públicos ───────────────────────────────────────────────────────────────

  @Get('promo')
  getPromoConcurso() {
    return this.getPromo.execute();
  }

  @Get(':id/reglas')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async getReglas(@Param('id', ParseUUIDPipe) id: string) {
    const c = await this.getConcurso.execute(id);
    return buildPublicPageHtml(c.titulo, 'Bases del Concurso', c.reglas);
  }

  @Get(':id/legales')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async getLegales(@Param('id', ParseUUIDPipe) id: string) {
    const c = await this.getConcurso.execute(id);
    return buildPublicPageHtml(c.titulo, 'Términos Legales', c.legal);
  }

  @Get()
  list(@Query('admin') admin?: string) {
    return this.listConcursos.execute(admin === 'true');
  }

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.getConcurso.execute(id);
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  create(@Body(new ValidationPipe({ whitelist: true, transform: true })) dto: CreateConcursoDto) {
    return this.createConcurso.execute({
      titulo: dto.titulo,
      montoMinimo: dto.montoMinimo,
      fechaDesde: new Date(dto.fechaDesde),
      fechaHasta: dto.fechaHasta ? new Date(dto.fechaHasta) : undefined,
      reglas: dto.reglas,
      legal: dto.legal,
      imagenPromoUrl: dto.imagenPromoUrl,
      imagenPromoActiva: dto.imagenPromoActiva,
      permiteMultiplesParticipaciones: dto.permiteMultiplesParticipaciones,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: UpdateConcursoDto,
  ) {
    return this.updateConcurso.execute({
      id,
      titulo: dto.titulo,
      montoMinimo: dto.montoMinimo,
      fechaDesde: dto.fechaDesde ? new Date(dto.fechaDesde) : undefined,
      fechaHasta: dto.fechaHasta !== undefined ? (dto.fechaHasta ? new Date(dto.fechaHasta) : null) : undefined,
      reglas: dto.reglas,
      legal: dto.legal,
      imagenPromoUrl: dto.imagenPromoUrl,
      imagenPromoActiva: dto.imagenPromoActiva,
      permiteMultiplesParticipaciones: dto.permiteMultiplesParticipaciones,
    });
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: ChangeEstadoDto,
  ) {
    return this.changeEstado.execute(id, dto.estado);
  }

  @Post(':id/draw')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  draw(@Param('id', ParseUUIDPipe) id: string) {
    return this.drawWinner.execute(id);
  }

  @Get(':id/participantes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  getParticipantes(@Param('id', ParseUUIDPipe) id: string) {
    return this.listParticipantes.execute(id);
  }

  @Post(':id/sync-ordenes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  syncOrdenes(@Param('id', ParseUUIDPipe) id: string) {
    return this.syncParticipaciones.execute(id);
  }
}
