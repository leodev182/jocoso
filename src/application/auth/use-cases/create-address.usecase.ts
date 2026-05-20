import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Address } from '../../../domain/auth/entities/address.entity';
import { IAddressRepository, ADDRESS_REPOSITORY } from '../../../domain/auth/repositories/address.repository';

export interface CreateAddressCommand {
  userId: string;
  alias: string;
  fullName: string;
  rut: string;
  phone: string;
  region: string;
  ciudad: string;
  comuna: string;
  calle: string;
  numero: string;
  depto?: string;
  referencia?: string;
}

@Injectable()
export class CreateAddressUseCase {
  constructor(@Inject(ADDRESS_REPOSITORY) private readonly repo: IAddressRepository) {}

  async execute(cmd: CreateAddressCommand): Promise<Address> {
    const existing = await this.repo.findByUserId(cmd.userId);
    if (existing.length >= 5) throw new BadRequestException('Máximo 5 direcciones por usuario');

    const isFirst = existing.length === 0;
    const address = Address.create({
      ...cmd,
      depto: cmd.depto ?? null,
      referencia: cmd.referencia ?? null,
      isDefault: isFirst,
    });

    if (isFirst) {
      await this.repo.unsetDefaultForUser(cmd.userId);
    }

    await this.repo.save(address);
    return address;
  }
}
