import { Concurso, ConcursoEstado } from '../entities/concurso.entity';

export interface IConcursoRepository {
  findById(id: string): Promise<Concurso | null>;
  findAll(estado?: ConcursoEstado): Promise<Concurso[]>;
  findActive(): Promise<Concurso[]>;
  findFinishedOrderedByOldest(): Promise<Concurso[]>;
  countActive(): Promise<number>;
  findActiveQualifying(amount: number, createdAt: Date): Promise<Concurso[]>;
  save(concurso: Concurso): Promise<void>;
  update(concurso: Concurso): Promise<void>;
  delete(id: string): Promise<void>;
}

export const CONCURSO_REPOSITORY = Symbol('IConcursoRepository');
