import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IConcursoRepository } from '../../domain/concursos/repositories/concurso.repository';
import { Concurso, ConcursoEstado, ConcursoProps } from '../../domain/concursos/entities/concurso.entity';

@Injectable()
export class ConcursoPrismaRepository implements IConcursoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Concurso | null> {
    const row = await this.prisma.concurso.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findAll(estado?: ConcursoEstado): Promise<Concurso[]> {
    const rows = await this.prisma.concurso.findMany({
      where: estado ? { estado: estado as any } : undefined,
      orderBy: { creadoEn: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findActive(): Promise<Concurso[]> {
    const rows = await this.prisma.concurso.findMany({
      where: { estado: 'ACTIVE' as any },
      orderBy: { creadoEn: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findFinishedOrderedByOldest(): Promise<Concurso[]> {
    const rows = await this.prisma.concurso.findMany({
      where: { estado: 'FINISHED' as any },
      orderBy: { creadoEn: 'asc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async countActive(): Promise<number> {
    return this.prisma.concurso.count({ where: { estado: 'ACTIVE' as any } });
  }

  async findActiveQualifying(amount: number, createdAt: Date): Promise<Concurso[]> {
    const rows = await this.prisma.concurso.findMany({
      where: {
        estado: 'ACTIVE' as any,
        montoMinimo: { lte: amount },
        fechaDesde: { lte: createdAt },
        OR: [
          { fechaHasta: null },
          { fechaHasta: { gte: createdAt } },
        ],
      },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async save(concurso: Concurso): Promise<void> {
    const d = concurso.toPersistence();
    await this.prisma.concurso.create({
      data: {
        id: d.id, titulo: d.titulo, estado: d.estado as any,
        montoMinimo: d.montoMinimo, fechaDesde: d.fechaDesde, fechaHasta: d.fechaHasta,
        reglas: d.reglas, legal: d.legal,
        imagenPromoUrl: d.imagenPromoUrl, imagenPromoActiva: d.imagenPromoActiva,
        resultadoVisible: d.resultadoVisible, ganadorOrdenId: d.ganadorOrdenId,
        ganadorFallbackNombre: d.ganadorFallbackNombre,
        permiteMultiplesParticipaciones: d.permiteMultiplesParticipaciones,
        minimoTickets: d.minimoTickets,
      },
    });
  }

  async update(concurso: Concurso): Promise<void> {
    const d = concurso.toPersistence();
    await this.prisma.concurso.update({
      where: { id: d.id },
      data: {
        titulo: d.titulo, estado: d.estado as any,
        montoMinimo: d.montoMinimo, fechaDesde: d.fechaDesde, fechaHasta: d.fechaHasta,
        reglas: d.reglas, legal: d.legal,
        imagenPromoUrl: d.imagenPromoUrl, imagenPromoActiva: d.imagenPromoActiva,
        resultadoVisible: d.resultadoVisible, ganadorOrdenId: d.ganadorOrdenId,
        ganadorFallbackNombre: d.ganadorFallbackNombre,
        permiteMultiplesParticipaciones: d.permiteMultiplesParticipaciones,
        minimoTickets: d.minimoTickets,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.concurso.delete({ where: { id } });
  }

  private toEntity(row: any): Concurso {
    return Concurso.reconstitute({
      id: row.id, titulo: row.titulo, estado: row.estado as ConcursoEstado,
      montoMinimo: Number(row.montoMinimo), fechaDesde: row.fechaDesde,
      fechaHasta: row.fechaHasta ?? null, reglas: row.reglas, legal: row.legal,
      imagenPromoUrl: row.imagenPromoUrl ?? null,
      imagenPromoActiva: row.imagenPromoActiva, resultadoVisible: row.resultadoVisible,
      ganadorOrdenId: row.ganadorOrdenId ?? null,
      ganadorFallbackNombre: row.ganadorFallbackNombre ?? null,
      permiteMultiplesParticipaciones: row.permiteMultiplesParticipaciones,
      minimoTickets: row.minimoTickets ?? 1,
      creadoEn: row.creadoEn, actualizadoEn: row.actualizadoEn,
    } as ConcursoProps);
  }
}
