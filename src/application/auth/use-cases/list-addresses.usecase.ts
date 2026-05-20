import { Injectable, Inject } from '@nestjs/common';
import { IAddressRepository, ADDRESS_REPOSITORY } from '../../../domain/auth/repositories/address.repository';

@Injectable()
export class ListAddressesUseCase {
  constructor(@Inject(ADDRESS_REPOSITORY) private readonly repo: IAddressRepository) {}

  async execute(userId: string) {
    const addresses = await this.repo.findByUserId(userId);
    return addresses.map((a) => a.toPersistence());
  }
}
