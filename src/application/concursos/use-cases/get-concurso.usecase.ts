import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IConcursoRepository, CONCURSO_REPOSITORY } from '../../../domain/concursos/repositories/concurso.repository';
import { IParticipacionRepository, PARTICIPACION_REPOSITORY } from '../../../domain/concursos/repositories/participacion.repository';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class GetConcursoUseCase {
  constructor(
    @Inject(CONCURSO_REPOSITORY) private readonly repo: IConcursoRepository,
    @Inject(PARTICIPACION_REPOSITORY) private readonly participacionRepo: IParticipacionRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string) {
    const c = await this.repo.findById(id);
    if (!c) throw new NotFoundException(`Concurso ${id} no encontrado`);

    let ganadorNombre: string | null = null;
    let ganadorEmail: string | null = null;
    let ganadorPhone: string | null = null;
    if (c.getGanadorOrdenId()) {
      const order = await this.prisma.order.findUnique({
        where: { id: c.getGanadorOrdenId()! },
        select: { user: { select: { name: true, email: true, phone: true } } },
      });
      ganadorNombre = order?.user?.name ?? null;
      ganadorEmail = order?.user?.email ?? null;
      ganadorPhone = order?.user?.phone ?? null;
    }

    return {
      id: c.getId(),
      titulo: c.getTitulo(),
      estado: c.getEstado(),
      montoMinimo: c.getMontoMinimo(),
      fechaDesde: c.getFechaDesde(),
      fechaHasta: c.getFechaHasta(),
      reglas: c.getReglas(),
      legal: c.getLegal(),
      imagenPromoUrl: c.getImagenPromoUrl(),
      imagenPromoActiva: c.isImagenPromoActiva(),
      resultadoVisible: c.isResultadoVisible(),
      ganadorOrdenId: c.getGanadorOrdenId(),
      ganadorFallbackNombre: c.getGanadorFallbackNombre(),
      ganadorNombre,
      ganadorEmail,
      ganadorPhone,
      permiteMultiplesParticipaciones: c.permiteMultiples(),
      minimoTickets: c.getMinimoTickets(),
      creadoEn: c.getCreadoEn(),
      participantesCount: await this.participacionRepo.countByConcurso(c.getId()),
    };
  }
}
