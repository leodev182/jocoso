import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ConcursoEstado } from '../../../domain/concursos/entities/concurso.entity';
import { IConcursoRepository, CONCURSO_REPOSITORY } from '../../../domain/concursos/repositories/concurso.repository';
import { IParticipacionRepository, PARTICIPACION_REPOSITORY } from '../../../domain/concursos/repositories/participacion.repository';
import { ConcursoDomainService } from '../../../domain/concursos/services/concurso.domain.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { Participacion } from '../../../domain/concursos/entities/participacion.entity';
import { OrderOrigin } from '../../../domain/orders/entities/order.entity';

@Injectable()
export class ChangeEstadoConcursoUseCase {
  constructor(
    @Inject(CONCURSO_REPOSITORY) private readonly concursoRepo: IConcursoRepository,
    @Inject(PARTICIPACION_REPOSITORY) private readonly participacionRepo: IParticipacionRepository,
    private readonly domainService: ConcursoDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string, nuevoEstado: ConcursoEstado): Promise<void> {
    const concurso = await this.concursoRepo.findById(id);
    if (!concurso) throw new NotFoundException(`Concurso ${id} no encontrado`);

    if (nuevoEstado === ConcursoEstado.ACTIVE) {
      const activeCount = await this.concursoRepo.countActive();
      this.domainService.assertMaxActive(activeCount);
      concurso.activar();
      await this.concursoRepo.update(concurso);
      await this.syncParticipaciones(concurso.getId(), concurso.getMontoMinimo(), concurso.getFechaDesde(), concurso.getFechaHasta());
    }

    if (nuevoEstado === ConcursoEstado.FINISHED) {
      concurso.finalizar();
      await this.concursoRepo.update(concurso);
      // Purgar el más antiguo si se supera el límite de histórico
      const finished = await this.concursoRepo.findFinishedOrderedByOldest();
      const toPurge = this.domainService.getConcursoToPurge(finished);
      if (toPurge) await this.concursoRepo.delete(toPurge.getId());
    }
  }

  private async syncParticipaciones(concursoId: string, montoMinimo: number, fechaDesde: Date, fechaHasta: Date | null): Promise<void> {
    const orders = await this.prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        origin: { not: 'ML' as any },
        totalAmount: { gte: montoMinimo },
        createdAt: {
          gte: fechaDesde,
          ...(fechaHasta ? { lte: fechaHasta } : {}),
        },
      },
      select: { id: true, userId: true },
    });

    await this.participacionRepo.deleteAllByConcurso(concursoId);

    for (const order of orders) {
      const p = Participacion.create(concursoId, order.id, order.userId);
      await this.participacionRepo.save(p);
    }
  }
}
