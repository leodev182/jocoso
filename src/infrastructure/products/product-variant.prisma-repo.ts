import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IProductVariantRepository } from '../../domain/products/repositories/product-variant.repository';
import { ProductVariant, ProductVariantProps } from '../../domain/products/entities/product-variant.entity';

@Injectable()
export class ProductVariantPrismaRepository implements IProductVariantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ProductVariant | null> {
    const row = await this.prisma.productVariant.findUnique({ where: { id }, include: { attributes: true } });
    return row ? this.toEntity(row) : null;
  }

  async findBySku(sku: string): Promise<ProductVariant | null> {
    const row = await this.prisma.productVariant.findUnique({ where: { sku }, include: { attributes: true } });
    return row ? this.toEntity(row) : null;
  }

  async findByProductId(productId: string): Promise<ProductVariant[]> {
    const rows = await this.prisma.productVariant.findMany({ where: { productId }, include: { attributes: true } });
    return rows.map((r) => this.toEntity(r));
  }

  async findByMlVariationId(mlVariationId: string): Promise<ProductVariant | null> {
    const row = await this.prisma.productVariant.findFirst({ where: { mlVariationId }, include: { attributes: true } });
    return row ? this.toEntity(row) : null;
  }

  async save(variant: ProductVariant): Promise<void> {
    const d = variant.toPersistence();
    await this.prisma.productVariant.create({
      data: {
        id: d.id, productId: d.productId, sku: d.sku,
        price: d.price, stock: d.stock, mlVariationId: d.mlVariationId,
        attributes: { create: d.attributes },
      },
    });
  }

  async update(variant: ProductVariant): Promise<void> {
    const d = variant.toPersistence();
    await this.prisma.$transaction([
      this.prisma.variantAttribute.deleteMany({ where: { variantId: d.id } }),
      this.prisma.productVariant.update({
        where: { id: d.id },
        data: {
          price: d.price, mlVariationId: d.mlVariationId,
          attributes: { create: d.attributes },
        },
      }),
    ]);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productVariant.delete({ where: { id } });
  }

  private toEntity(row: any): ProductVariant {
    return ProductVariant.reconstitute({
      id: row.id, productId: row.productId, sku: row.sku,
      price: Number(row.price), stock: row.stock,
      mlVariationId: row.mlVariationId,
      attributes: row.attributes?.map((a: any) => ({ name: a.name, value: a.value })) ?? [],
      createdAt: row.createdAt, updatedAt: row.updatedAt,
    } as ProductVariantProps);
  }
}
