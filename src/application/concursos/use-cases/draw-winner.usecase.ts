import { Injectable, Inject, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { IConcursoRepository, CONCURSO_REPOSITORY } from '../../../domain/concursos/repositories/concurso.repository';
import { IParticipacionRepository, PARTICIPACION_REPOSITORY } from '../../../domain/concursos/repositories/participacion.repository';
import { ConcursoDomainService } from '../../../domain/concursos/services/concurso.domain.service';

export interface DrawWinnerResult {
  ganadorOrdenId: string | null;
  ganadorFallbackNombre: string | null;
  esFallback: boolean;
}

@Injectable()
export class DrawWinnerUseCase {
  constructor(
    @Inject(CONCURSO_REPOSITORY) private readonly concursoRepo: IConcursoRepository,
    @Inject(PARTICIPACION_REPOSITORY) private readonly participacionRepo: IParticipacionRepository,
    private readonly domainService: ConcursoDomainService,
  ) {}

  async execute(concursoId: string, fallbackNombre?: string): Promise<DrawWinnerResult> {
    const concurso = await this.concursoRepo.findById(concursoId);
    if (!concurso) throw new NotFoundException(`Concurso ${concursoId} no encontrado`);

    this.domainService.assertCanDraw(concurso);

    const participaciones = await this.participacionRepo.findByConcurso(concursoId);
    const count = participaciones.length;
    const minimo = concurso.getMinimoTickets();

    // Mínimo no alcanzado — requiere fallback
    if (count < minimo) {
      if (!fallbackNombre?.trim()) {
        throw new UnprocessableEntityException(
          `Se requieren al menos ${minimo} tickets. Hay ${count}. Envía "fallbackNombre" para designar un ganador alternativo.`,
        );
      }
      concurso.setGanadorFallback(fallbackNombre.trim());
      await this.concursoRepo.update(concurso);
      return { ganadorOrdenId: null, ganadorFallbackNombre: fallbackNombre.trim(), esFallback: true };
    }

    // Ruleta real
    const ordenIds = participaciones.map((p) => p.getOrdenId());
    const ganadorOrdenId = this.domainService.pickWinner(ordenIds);
    concurso.setGanador(ganadorOrdenId);
    await this.concursoRepo.update(concurso);

    return { ganadorOrdenId, ganadorFallbackNombre: null, esFallback: false };
  }
}
