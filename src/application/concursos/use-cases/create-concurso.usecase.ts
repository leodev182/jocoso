import { Injectable, Inject } from '@nestjs/common';
import { Concurso } from '../../../domain/concursos/entities/concurso.entity';
import { IConcursoRepository, CONCURSO_REPOSITORY } from '../../../domain/concursos/repositories/concurso.repository';

export interface CreateConcursoCommand {
  titulo: string;
  montoMinimo: number;
  fechaDesde: Date;
  fechaHasta?: Date;
  reglas: string;
  legal: string;
  imagenPromoUrl?: string;
  imagenPromoActiva: boolean;
  permiteMultiplesParticipaciones: boolean;
}

@Injectable()
export class CreateConcursoUseCase {
  constructor(@Inject(CONCURSO_REPOSITORY) private readonly repo: IConcursoRepository) {}

  async execute(cmd: CreateConcursoCommand): Promise<{ id: string }> {
    const concurso = Concurso.create({
      titulo: cmd.titulo,
      montoMinimo: cmd.montoMinimo,
      fechaDesde: cmd.fechaDesde,
      fechaHasta: cmd.fechaHasta ?? null,
      reglas: cmd.reglas,
      legal: cmd.legal,
      imagenPromoUrl: cmd.imagenPromoUrl ?? null,
      imagenPromoActiva: cmd.imagenPromoActiva,
      permiteMultiplesParticipaciones: cmd.permiteMultiplesParticipaciones,
    });
    await this.repo.save(concurso);
    return { id: concurso.getId() };
  }
}
