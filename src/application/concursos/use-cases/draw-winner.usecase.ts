import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IConcursoRepository, CONCURSO_REPOSITORY } from '../../../domain/concursos/repositories/concurso.repository';
import { IParticipacionRepository, PARTICIPACION_REPOSITORY } from '../../../domain/concursos/repositories/participacion.repository';
import { ConcursoDomainService } from '../../../domain/concursos/services/concurso.domain.service';

@Injectable()
export class DrawWinnerUseCase {
  constructor(
    @Inject(CONCURSO_REPOSITORY) private readonly concursoRepo: IConcursoRepository,
    @Inject(PARTICIPACION_REPOSITORY) private readonly participacionRepo: IParticipacionRepository,
    private readonly domainService: ConcursoDomainService,
  ) {}

  async execute(concursoId: string): Promise<{ ganadorOrdenId: string }> {
    const concurso = await this.concursoRepo.findById(concursoId);
    if (!concurso) throw new NotFoundException(`Concurso ${concursoId} no encontrado`);

    this.domainService.assertCanDraw(concurso);

    const participaciones = await this.participacionRepo.findByConcurso(concursoId);
    const ordenIds = participaciones.map((p) => p.getOrdenId());

    const ganadorOrdenId = this.domainService.pickWinner(ordenIds);
    concurso.setGanador(ganadorOrdenId);
    await this.concursoRepo.update(concurso);

    return { ganadorOrdenId };
  }
}
