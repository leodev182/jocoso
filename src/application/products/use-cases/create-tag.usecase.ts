import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { Tag } from '../../../domain/products/entities/tag.entity';
import { ITagRepository, TAG_REPOSITORY } from '../../../domain/products/repositories/tag.repository';

function toSlug(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export interface CreateTagCommand { name: string; color?: string; }

@Injectable()
export class CreateTagUseCase {
  constructor(@Inject(TAG_REPOSITORY) private readonly repo: ITagRepository) {}

  async execute(cmd: CreateTagCommand): Promise<Tag> {
    const slug = toSlug(cmd.name);
    const existing = await this.repo.findBySlug(slug);
    if (existing) throw new ConflictException(`Tag "${cmd.name}" ya existe`);

    const tag = Tag.create(cmd.name, slug, cmd.color);
    await this.repo.save(tag);
    return tag;
  }
}
