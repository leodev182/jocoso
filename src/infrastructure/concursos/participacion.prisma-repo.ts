import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IParticipacionRepository } from '../../domain/concursos/repositories/participacion.repository';
import { Participacion, ParticipacionProps } from '../../domain/concursos/entities/participacion.entity';

@Injectable()
export class ParticipacionPrismaRepository implements IParticipacionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByConcurso(concursoId: string): Promise<Participacion[]> {
    const rows = await this.prisma.participacion.findMany({ where: { concursoId }, orderBy: { creadoEn: 'asc' } });
    return rows.map((r) => this.toEntity(r));
  }

  async findByConcursoAndOrden(concursoId: string, ordenId: string): Promise<Participacion | null> {
    const row = await this.prisma.participacion.findUnique({ where: { concursoId_ordenId: { concursoId, ordenId } } });
    return row ? this.toEntity(row) : null;
  }

  async findByConcursoAndUsuario(concursoId: string, usuarioId: string): Promise<Participacion[]> {
    const rows = await this.prisma.participacion.findMany({ where: { concursoId, usuarioId } });
    return rows.map((r) => this.toEntity(r));
  }

  async countByConcurso(concursoId: string): Promise<number> {
    return this.prisma.participacion.count({ where: { concursoId } });
  }

  async save(participacion: Participacion): Promise<void> {
    const d = participacion.toPersistence();
    await this.prisma.participacion.create({
      data: { id: d.id, concursoId: d.concursoId, ordenId: d.ordenId, usuarioId: d.usuarioId },
    });
  }

  async deleteAllByConcurso(concursoId: string): Promise<void> {
    await this.prisma.participacion.deleteMany({ where: { concursoId } });
  }

  private toEntity(row: any): Participacion {
    return Participacion.reconstitute({ id: row.id, concursoId: row.concursoId, ordenId: row.ordenId, usuarioId: row.usuarioId, creadoEn: row.creadoEn } as ParticipacionProps);
  }
}
