import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class GetAdminStatsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      orderGroups,
      revenueResult,
      paymentGroups,
      lowStockVariants,
      totalProducts,
      activeProducts,
    ] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: { in: ['COMPLETED', 'SHIPPED'] },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.payment.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.productVariant.findMany({
        where: { stock: { lte: LOW_STOCK_THRESHOLD } },
        select: {
          id: true,
          sku: true,
          stock: true,
          product: { select: { title: true } },
        },
        orderBy: { stock: 'asc' },
      }),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { status: 'ACTIVE' } }),
    ]);

    const ordersByStatus = Object.fromEntries(
      orderGroups.map((g) => [g.status, g._count.status]),
    );

    const paymentsByStatus = Object.fromEntries(
      paymentGroups.map((g) => [g.status, g._count.status]),
    );

    return {
      orders: {
        total: orderGroups.reduce((sum, g) => sum + g._count.status, 0),
        byStatus: ordersByStatus,
        revenueLast30Days: Number(revenueResult._sum.totalAmount ?? 0),
      },
      payments: {
        approved: paymentsByStatus['APPROVED'] ?? 0,
        rejected: paymentsByStatus['REJECTED'] ?? 0,
        pending: paymentsByStatus['PENDING'] ?? 0,
        settled: paymentsByStatus['SETTLED'] ?? 0,
      },
      stock: {
        lowStock: lowStockVariants.map((v) => ({
          variantId: v.id,
          sku: v.sku,
          stock: v.stock,
          productTitle: v.product.title,
        })),
      },
      products: {
        total: totalProducts,
        active: activeProducts,
      },
    };
  }
}
