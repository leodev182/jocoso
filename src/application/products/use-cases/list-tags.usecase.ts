import { Injectable, Inject } from '@nestjs/common';
import { ITagRepository, TAG_REPOSITORY } from '../../../domain/products/repositories/tag.repository';

@Injectable()
export class ListTagsUseCase {
  constructor(@Inject(TAG_REPOSITORY) private readonly repo: ITagRepository) {}

  async execute() {
    const tags = await this.repo.findAll();
    return tags.map((t) => t.toPersistence());
  }
}
