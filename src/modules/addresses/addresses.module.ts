import { Module } from '@nestjs/common';
import { ADDRESS_REPOSITORY } from '../../domain/auth/repositories/address.repository';
import { AddressPrismaRepository } from '../../infrastructure/auth/address.prisma-repo';
import { CreateAddressUseCase } from '../../application/auth/use-cases/create-address.usecase';
import { ListAddressesUseCase } from '../../application/auth/use-cases/list-addresses.usecase';
import { SetDefaultAddressUseCase } from '../../application/auth/use-cases/set-default-address.usecase';
import { DeleteAddressUseCase } from '../../application/auth/use-cases/delete-address.usecase';
import { AddressesController } from '../../interfaces/http/addresses/addresses.controller';

@Module({
  controllers: [AddressesController],
  providers: [
    CreateAddressUseCase,
    ListAddressesUseCase,
    SetDefaultAddressUseCase,
    DeleteAddressUseCase,
    { provide: ADDRESS_REPOSITORY, useClass: AddressPrismaRepository },
  ],
})
export class AddressesModule {}
