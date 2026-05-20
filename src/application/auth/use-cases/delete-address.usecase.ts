import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IAddressRepository, ADDRESS_REPOSITORY } from '../../../domain/auth/repositories/address.repository';

@Injectable()
export class DeleteAddressUseCase {
  constructor(@Inject(ADDRESS_REPOSITORY) private readonly repo: IAddressRepository) {}

  async execute(userId: string, addressId: string): Promise<void> {
    const address = await this.repo.findById(addressId);
    if (!address) throw new NotFoundException('Dirección no encontrada');
    if (address.getUserId() !== userId) throw new ForbiddenException();

    address.deactivate();
    await this.repo.update(address);
  }
}
