import { Participacion } from '../entities/participacion.entity';

export interface IParticipacionRepository {
  findByConcurso(concursoId: string): Promise<Participacion[]>;
  findByConcursoAndOrden(concursoId: string, ordenId: string): Promise<Participacion | null>;
  findByConcursoAndUsuario(concursoId: string, usuarioId: string): Promise<Participacion[]>;
  countByConcurso(concursoId: string): Promise<number>;
  save(participacion: Participacion): Promise<void>;
  deleteAllByConcurso(concursoId: string): Promise<void>;
}

export const PARTICIPACION_REPOSITORY = Symbol('IParticipacionRepository');
