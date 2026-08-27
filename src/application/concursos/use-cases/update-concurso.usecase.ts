import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IConcursoRepository, CONCURSO_REPOSITORY } from '../../../domain/concursos/repositories/concurso.repository';

export interface UpdateConcursoCommand {
  id: string;
  titulo?: string;
  montoMinimo?: number;
  fechaDesde?: Date;
  fechaHasta?: Date | null;
  reglas?: string;
  legal?: string;
  imagenPromoUrl?: string | null;
  imagenPromoActiva?: boolean;
  permiteMultiplesParticipaciones?: boolean;
}

@Injectable()
export class UpdateConcursoUseCase {
  constructor(@Inject(CONCURSO_REPOSITORY) private readonly repo: IConcursoRepository) {}

  async execute(cmd: UpdateConcursoCommand): Promise<void> {
    const concurso = await this.repo.findById(cmd.id);
    if (!concurso) throw new NotFoundException(`Concurso ${cmd.id} no encontrado`);
    const { id, ...fields } = cmd;
    concurso.update(fields);
    await this.repo.update(concurso);
  }
}
