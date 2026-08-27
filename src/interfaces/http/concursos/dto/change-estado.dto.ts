import { IsEnum } from 'class-validator';
import { ConcursoEstado } from '../../../../domain/concursos/entities/concurso.entity';

export class ChangeEstadoDto {
  @IsEnum([ConcursoEstado.ACTIVE, ConcursoEstado.FINISHED], { message: 'estado debe ser ACTIVE o FINISHED' })
  estado: ConcursoEstado;
}
