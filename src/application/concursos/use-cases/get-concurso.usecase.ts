import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IConcursoRepository, CONCURSO_REPOSITORY } from '../../../domain/concursos/repositories/concurso.repository';
import { IParticipacionRepository, PARTICIPACION_REPOSITORY } from '../../../domain/concursos/repositories/participacion.repository';

@Injectable()
export class GetConcursoUseCase {
  constructor(
    @Inject(CONCURSO_REPOSITORY) private readonly repo: IConcursoRepository,
    @Inject(PARTICIPACION_REPOSITORY) private readonly participacionRepo: IParticipacionRepository,
  ) {}

  async execute(id: string) {
    const c = await this.repo.findById(id);
    if (!c) throw new NotFoundException(`Concurso ${id} no encontrado`);
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
      permiteMultiplesParticipaciones: c.permiteMultiples(),
      minimoTickets: c.getMinimoTickets(),
      ganadorFallbackNombre: c.getGanadorFallbackNombre(),
      creadoEn: c.getCreadoEn(),
      participantesCount: await this.participacionRepo.countByConcurso(c.getId()),
    };
  }
}
