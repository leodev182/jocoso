import { Injectable, Inject } from '@nestjs/common';
import { IConcursoRepository, CONCURSO_REPOSITORY } from '../../../domain/concursos/repositories/concurso.repository';
import { IParticipacionRepository, PARTICIPACION_REPOSITORY } from '../../../domain/concursos/repositories/participacion.repository';
import { ConcursoEstado } from '../../../domain/concursos/entities/concurso.entity';

@Injectable()
export class ListConcursosUseCase {
  constructor(
    @Inject(CONCURSO_REPOSITORY) private readonly repo: IConcursoRepository,
    @Inject(PARTICIPACION_REPOSITORY) private readonly participacionRepo: IParticipacionRepository,
  ) {}

  async execute(isAdmin: boolean) {
    const concursos = isAdmin
      ? await this.repo.findAll()
      : await this.repo.findAll(ConcursoEstado.ACTIVE).then(async (active) => {
          const finished = await this.repo.findFinishedOrderedByOldest();
          return [...active, ...finished.reverse()]; // finished mas reciente primero
        });

    return Promise.all(
      concursos.map(async (c) => ({
        id: c.getId(),
        titulo: c.getTitulo(),
        estado: c.getEstado(),
        montoMinimo: c.getMontoMinimo(),
        fechaDesde: c.getFechaDesde(),
        fechaHasta: c.getFechaHasta(),
        imagenPromoUrl: c.getImagenPromoUrl(),
        imagenPromoActiva: c.isImagenPromoActiva(),
        resultadoVisible: c.isResultadoVisible(),
        ganadorOrdenId: c.getGanadorOrdenId(),
        permiteMultiplesParticipaciones: c.permiteMultiples(),
        creadoEn: c.getCreadoEn(),
        participantesCount: await this.participacionRepo.countByConcurso(c.getId()),
      })),
    );
  }
}
