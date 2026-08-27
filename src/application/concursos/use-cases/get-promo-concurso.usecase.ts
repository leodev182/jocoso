import { Injectable, Inject } from '@nestjs/common';
import { IConcursoRepository, CONCURSO_REPOSITORY } from '../../../domain/concursos/repositories/concurso.repository';

@Injectable()
export class GetPromoConcursoUseCase {
  constructor(@Inject(CONCURSO_REPOSITORY) private readonly repo: IConcursoRepository) {}

  async execute() {
    const activos = await this.repo.findActive();
    const conPromo = activos.find((c) => c.isImagenPromoActiva() && c.getImagenPromoUrl());
    if (!conPromo) return null;
    return {
      id: conPromo.getId(),
      titulo: conPromo.getTitulo(),
      imagenPromoUrl: conPromo.getImagenPromoUrl(),
      montoMinimo: conPromo.getMontoMinimo(),
      fechaDesde: conPromo.getFechaDesde(),
      fechaHasta: conPromo.getFechaHasta(),
    };
  }
}
