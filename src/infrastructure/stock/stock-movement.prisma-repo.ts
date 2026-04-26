import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IStockMovementRepository } from '../../domain/stock/repositories/stock-movement.repository';
import { StockMovement, StockSource, ReferenceType } from '../../domain/stock/entities/stock-movement.entity';

@Injectable()
export class StockMovementPrismaRepository implements IStockMovementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByExternalId(externalId: string): Promise<StockMovement | null> {
    const row = await this.prisma.stockMovement.findUnique({ where: { externalId } });
    return row ? this.toEntity(row) : null;
  }

  async findByVariantId(variantId: string, limit = 20, skip = 0): Promise<StockMovement[]> {
    const rows = await this.prisma.stockMovement.findMany({
      where: { variantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
    return rows.map((r) => this.toEntity(r));
  }

  private toEntity(row: any): StockMovement {
    return StockMovement.reconstitute({
      id: row.id,
      variantId: row.variantId,
      quantity: row.quantity,
      source: row.source as StockSource,
      referenceType: row.referenceType as ReferenceType,
      referenceId: row.referenceId,
      externalId: row.externalId,
      userId: row.userId,
      createdAt: row.createdAt,
    });
  }
}
