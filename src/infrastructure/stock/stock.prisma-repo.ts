import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IStockRepository } from '../../domain/stock/repositories/stock.repository';
import { Stock } from '../../domain/stock/entities/stock.entity';
import { StockMovement } from '../../domain/stock/entities/stock-movement.entity';

interface VariantStockRow {
  stock: number;
}

@Injectable()
export class StockPrismaRepository implements IStockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByVariantId(variantId: string): Promise<Stock | null> {
    const row = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, stock: true },
    });
    if (!row) return null;
    return Stock.reconstitute(row.id, row.stock);
  }

  async decreaseWithLock(variantId: string, amount: number, movement: StockMovement): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        // Lock the row — no other transaction can read/write until commit
        const rows = await tx.$queryRaw<VariantStockRow[]>`
          SELECT stock FROM product_variants WHERE id = ${variantId} FOR UPDATE
        `;

        if (!rows.length) throw new NotFoundException(`Variant ${variantId} not found`);

        const current = rows[0].stock;
        if (current < amount) {
          throw new UnprocessableEntityException(
            `Insufficient stock. Available: ${current}, requested: ${amount}`,
          );
        }

        await tx.$executeRaw`
          UPDATE product_variants
          SET stock = stock - ${amount}, updated_at = NOW()
          WHERE id = ${variantId}
        `;

        const data = movement.toPersistence();
        await tx.stockMovement.create({
          data: {
            id: data.id,
            variantId: data.variantId,
            quantity: data.quantity,
            source: data.source as any,
            referenceType: data.referenceType as any,
            referenceId: data.referenceId,
            externalId: data.externalId,
            userId: data.userId,
            createdAt: data.createdAt,
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async increase(variantId: string, amount: number, movement: StockMovement): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const exists = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: { id: true },
      });
      if (!exists) throw new NotFoundException(`Variant ${variantId} not found`);

      await tx.$executeRaw`
        UPDATE product_variants
        SET stock = stock + ${amount}, updated_at = NOW()
        WHERE id = ${variantId}
      `;

      const data = movement.toPersistence();
      await tx.stockMovement.create({
        data: {
          id: data.id,
          variantId: data.variantId,
          quantity: data.quantity,
          source: data.source as any,
          referenceType: data.referenceType as any,
          referenceId: data.referenceId,
          externalId: data.externalId,
          userId: data.userId,
          createdAt: data.createdAt,
        },
      });
    });
  }
}
