import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IConcursoRepository, CONCURSO_REPOSITORY } from '../../../domain/concursos/repositories/concurso.repository';
import { IParticipacionRepository, PARTICIPACION_REPOSITORY } from '../../../domain/concursos/repositories/participacion.repository';
import { Participacion } from '../../../domain/concursos/entities/participacion.entity';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class SyncParticipacionesUseCase {
  constructor(
    @Inject(CONCURSO_REPOSITORY) private readonly concursoRepo: IConcursoRepository,
    @Inject(PARTICIPACION_REPOSITORY) private readonly participacionRepo: IParticipacionRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(concursoId: string): Promise<{ created: number }> {
    const concurso = await this.concursoRepo.findById(concursoId);
    if (!concurso) throw new NotFoundException(`Concurso ${concursoId} no encontrado`);

    const orders = await this.prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        origin: { not: 'ML' as any },
        totalAmount: { gte: concurso.getMontoMinimo() },
        createdAt: {
          gte: concurso.getFechaDesde(),
          ...(concurso.getFechaHasta() ? { lte: concurso.getFechaHasta()! } : {}),
        },
      },
      select: { id: true, userId: true },
    });

    await this.participacionRepo.deleteAllByConcurso(concursoId);

    for (const order of orders) {
      const p = Participacion.create(concursoId, order.id, order.userId);
      await this.participacionRepo.save(p);
    }

    return { created: orders.length };
  }
}
