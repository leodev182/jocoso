import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IAddressRepository, ADDRESS_REPOSITORY } from '../../../domain/auth/repositories/address.repository';

@Injectable()
export class SetDefaultAddressUseCase {
  constructor(@Inject(ADDRESS_REPOSITORY) private readonly repo: IAddressRepository) {}

  async execute(userId: string, addressId: string): Promise<void> {
    const address = await this.repo.findById(addressId);
    if (!address) throw new NotFoundException('Dirección no encontrada');
    if (address.getUserId() !== userId) throw new ForbiddenException();

    await this.repo.unsetDefaultForUser(userId);
    address.setAsDefault();
    await this.repo.update(address);
  }
}
