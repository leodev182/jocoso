import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ITagRepository } from '../../domain/products/repositories/tag.repository';
import { Tag, TagProps } from '../../domain/products/entities/tag.entity';

@Injectable()
export class TagPrismaRepository implements ITagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tag | null> {
    const row = await this.prisma.tag.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    const row = await this.prisma.tag.findUnique({ where: { slug } });
    return row ? this.toEntity(row) : null;
  }

  async findAll(): Promise<Tag[]> {
    const rows = await this.prisma.tag.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async save(tag: Tag): Promise<void> {
    const d = tag.toPersistence();
    await this.prisma.tag.create({
      data: { id: d.id, name: d.name, slug: d.slug, color: d.color, isActive: d.isActive },
    });
  }

  async update(tag: Tag): Promise<void> {
    const d = tag.toPersistence();
    await this.prisma.tag.update({
      where: { id: d.id },
      data: { name: d.name, color: d.color, isActive: d.isActive, updatedAt: d.updatedAt },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tag.update({ where: { id }, data: { isActive: false } });
  }

  async addToProduct(productId: string, tagId: string): Promise<void> {
    await this.prisma.productTag.create({ data: { productId, tagId } });
  }

  async removeFromProduct(productId: string, tagId: string): Promise<void> {
    await this.prisma.productTag.delete({ where: { productId_tagId: { productId, tagId } } });
  }

  async findByProductId(productId: string): Promise<Tag[]> {
    const rows = await this.prisma.productTag.findMany({
      where: { productId },
      include: { tag: true },
    });
    return rows.map((r) => this.toEntity(r.tag));
  }

  private toEntity(row: any): Tag {
    return Tag.reconstitute({
      id: row.id, name: row.name, slug: row.slug,
      color: row.color ?? null, isActive: row.isActive,
      createdAt: row.createdAt, updatedAt: row.updatedAt,
    } as TagProps);
  }
}
