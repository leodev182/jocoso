import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IConcursoRepository, CONCURSO_REPOSITORY } from '../../../domain/concursos/repositories/concurso.repository';
import { IParticipacionRepository, PARTICIPACION_REPOSITORY } from '../../../domain/concursos/repositories/participacion.repository';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class ListParticipantesUseCase {
  constructor(
    @Inject(CONCURSO_REPOSITORY) private readonly concursoRepo: IConcursoRepository,
    @Inject(PARTICIPACION_REPOSITORY) private readonly participacionRepo: IParticipacionRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(concursoId: string) {
    const concurso = await this.concursoRepo.findById(concursoId);
    if (!concurso) throw new NotFoundException(`Concurso ${concursoId} no encontrado`);

    const participaciones = await this.participacionRepo.findByConcurso(concursoId);

    return Promise.all(
      participaciones.map(async (p) => {
        const [user, order] = await Promise.all([
          this.prisma.user.findUnique({ where: { id: p.getUsuarioId() }, select: { name: true, email: true } }),
          this.prisma.order.findUnique({ where: { id: p.getOrdenId() }, select: { totalAmount: true, createdAt: true, origin: true } }),
        ]);
        return {
          id: p.getId(),
          ordenId: p.getOrdenId(),
          usuarioId: p.getUsuarioId(),
          creadoEn: p.getCreadoEn(),
          clienteNombre: user?.name ?? null,
          clienteEmail: user?.email ?? null,
          ordenTotal: order ? Number(order.totalAmount) : null,
          ordenFecha: order?.createdAt ?? null,
          ordenOrigen: order?.origin ?? null,
        };
      }),
    );
  }
}
