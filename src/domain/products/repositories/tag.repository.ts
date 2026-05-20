import { Tag } from '../entities/tag.entity';

export interface ITagRepository {
  findById(id: string): Promise<Tag | null>;
  findBySlug(slug: string): Promise<Tag | null>;
  findAll(): Promise<Tag[]>;
  save(tag: Tag): Promise<void>;
  update(tag: Tag): Promise<void>;
  delete(id: string): Promise<void>;
  addToProduct(productId: string, tagId: string): Promise<void>;
  removeFromProduct(productId: string, tagId: string): Promise<void>;
  findByProductId(productId: string): Promise<Tag[]>;
}

export const TAG_REPOSITORY = Symbol('ITagRepository');
