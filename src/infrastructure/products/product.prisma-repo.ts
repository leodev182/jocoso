import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IProductRepository } from '../../domain/products/repositories/product.repository';
import { Product, ProductStatus, ProductProps } from '../../domain/products/entities/product.entity';

@Injectable()
export class ProductPrismaRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findAll(status?: string): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async save(product: Product): Promise<void> {
    const d = product.toPersistence();
    await this.prisma.product.create({
      data: { id: d.id, title: d.title, description: d.description, status: d.status as any, mlItemId: d.mlItemId },
    });
  }

  async update(product: Product): Promise<void> {
    const d = product.toPersistence();
    await this.prisma.product.update({
      where: { id: d.id },
      data: { title: d.title, description: d.description, status: d.status as any, mlItemId: d.mlItemId },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  private toEntity(row: any): Product {
    return Product.reconstitute({
      id: row.id, title: row.title, description: row.description,
      status: row.status as ProductStatus, mlItemId: row.mlItemId,
      createdAt: row.createdAt, updatedAt: row.updatedAt,
    } as ProductProps);
  }
}
