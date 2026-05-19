import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ITagRepository, TAG_REPOSITORY } from '../../../domain/products/repositories/tag.repository';

@Injectable()
export class DeleteTagUseCase {
  constructor(@Inject(TAG_REPOSITORY) private readonly repo: ITagRepository) {}

  async execute(id: string): Promise<void> {
    const tag = await this.repo.findById(id);
    if (!tag) throw new NotFoundException(`Tag ${id} not found`);
    await this.repo.delete(id);
  }
}
