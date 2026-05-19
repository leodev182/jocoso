import { Controller, Get, Post, Delete, Body, Param, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { RolesGuard } from '../../../infrastructure/security/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../../domain/auth/entities/user.entity';
import { CreateTagUseCase } from '../../../application/products/use-cases/create-tag.usecase';
import { ListTagsUseCase } from '../../../application/products/use-cases/list-tags.usecase';
import { DeleteTagUseCase } from '../../../application/products/use-cases/delete-tag.usecase';
import { CreateTagDto } from './dto/create-tag.dto';

@Controller('tags')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPPORT)
export class TagsController {
  constructor(
    private readonly createTag: CreateTagUseCase,
    private readonly listTags: ListTagsUseCase,
    private readonly deleteTag: DeleteTagUseCase,
  ) {}

  @Get()
  list() {
    return this.listTags.execute();
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateTagDto) {
    return this.createTag.execute(dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.deleteTag.execute(id);
  }
}
