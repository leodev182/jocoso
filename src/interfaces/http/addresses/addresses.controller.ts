import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateAddressUseCase } from '../../../application/auth/use-cases/create-address.usecase';
import { ListAddressesUseCase } from '../../../application/auth/use-cases/list-addresses.usecase';
import { SetDefaultAddressUseCase } from '../../../application/auth/use-cases/set-default-address.usecase';
import { DeleteAddressUseCase } from '../../../application/auth/use-cases/delete-address.usecase';
import { CreateAddressDto } from './dto/create-address.dto';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(
    private readonly createAddress: CreateAddressUseCase,
    private readonly listAddresses: ListAddressesUseCase,
    private readonly setDefault: SetDefaultAddressUseCase,
    private readonly deleteAddress: DeleteAddressUseCase,
  ) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.listAddresses.execute(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateAddressDto) {
    return this.createAddress.execute({ userId: user.id, ...dto });
  }

  @Patch(':id/default')
  @HttpCode(HttpStatus.NO_CONTENT)
  setAsDefault(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.setDefault.execute(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deleteAddress.execute(user.id, id);
  }
}
