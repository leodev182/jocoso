import { Injectable, Inject } from '@nestjs/common';
import { IConcursoRepository, CONCURSO_REPOSITORY } from '../../../domain/concursos/repositories/concurso.repository';
import { IParticipacionRepository, PARTICIPACION_REPOSITORY } from '../../../domain/concursos/repositories/participacion.repository';
import { ConcursoEstado } from '../../../domain/concursos/entities/concurso.entity';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class ListConcursosUseCase {
  constructor(
    @Inject(CONCURSO_REPOSITORY) private readonly repo: IConcursoRepository,
    @Inject(PARTICIPACION_REPOSITORY) private readonly participacionRepo: IParticipacionRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(isAdmin: boolean) {
    const concursos = isAdmin
      ? await this.repo.findAll()
      : await this.repo.findAll(ConcursoEstado.ACTIVE).then(async (active) => {
          const finished = await this.repo.findFinishedOrderedByOldest();
          return [...active, ...finished.reverse()]; // finished mas reciente primero
        });

    return Promise.all(
      concursos.map(async (c) => {
        let ganadorNombre: string | null = null;
        let ganadorEmail: string | null = null;
        let ganadorPhone: string | null = null;
        if (c.getGanadorOrdenId()) {
          const order = await this.prisma.order.findUnique({
            where: { id: c.getGanadorOrdenId()! },
            select: { user: { select: { name: true, email: true, phone: true } } },
          });
          ganadorNombre = order?.user?.name ?? null;
          ganadorEmail = order?.user?.email ?? null;
          ganadorPhone = order?.user?.phone ?? null;
        }
        return {
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
          ganadorFallbackNombre: c.getGanadorFallbackNombre(),
          ganadorNombre,
          ganadorEmail,
          ganadorPhone,
          permiteMultiplesParticipaciones: c.permiteMultiples(),
          minimoTickets: c.getMinimoTickets(),
          creadoEn: c.getCreadoEn(),
          participantesCount: await this.participacionRepo.countByConcurso(c.getId()),
        };
      }),
    );
  }
}
