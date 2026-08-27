import { Module } from '@nestjs/common';
import { CONCURSO_REPOSITORY } from '../../domain/concursos/repositories/concurso.repository';
import { PARTICIPACION_REPOSITORY } from '../../domain/concursos/repositories/participacion.repository';
import { ConcursoPrismaRepository } from '../../infrastructure/concursos/concurso.prisma-repo';
import { ParticipacionPrismaRepository } from '../../infrastructure/concursos/participacion.prisma-repo';
import { ConcursoDomainService } from '../../domain/concursos/services/concurso.domain.service';
import { CreateConcursoUseCase } from '../../application/concursos/use-cases/create-concurso.usecase';
import { UpdateConcursoUseCase } from '../../application/concursos/use-cases/update-concurso.usecase';
import { ChangeEstadoConcursoUseCase } from '../../application/concursos/use-cases/change-estado-concurso.usecase';
import { DrawWinnerUseCase } from '../../application/concursos/use-cases/draw-winner.usecase';
import { ListConcursosUseCase } from '../../application/concursos/use-cases/list-concursos.usecase';
import { GetConcursoUseCase } from '../../application/concursos/use-cases/get-concurso.usecase';
import { ListParticipantesUseCase } from '../../application/concursos/use-cases/list-participantes.usecase';
import { SyncParticipacionesUseCase } from '../../application/concursos/use-cases/sync-participaciones.usecase';
import { GetPromoConcursoUseCase } from '../../application/concursos/use-cases/get-promo-concurso.usecase';
import { ConcursosController } from '../../interfaces/http/concursos/concursos.controller';

@Module({
  controllers: [ConcursosController],
  providers: [
    ConcursoDomainService,
    { provide: CONCURSO_REPOSITORY, useClass: ConcursoPrismaRepository },
    { provide: PARTICIPACION_REPOSITORY, useClass: ParticipacionPrismaRepository },
    CreateConcursoUseCase,
    UpdateConcursoUseCase,
    ChangeEstadoConcursoUseCase,
    DrawWinnerUseCase,
    ListConcursosUseCase,
    GetConcursoUseCase,
    ListParticipantesUseCase,
    SyncParticipacionesUseCase,
    GetPromoConcursoUseCase,
  ],
  exports: [CONCURSO_REPOSITORY],
})
export class ConcursosModule {}
