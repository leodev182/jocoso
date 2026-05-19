import { Address } from '../entities/address.entity';

export interface IAddressRepository {
  findById(id: string): Promise<Address | null>;
  findByUserId(userId: string): Promise<Address[]>;
  save(address: Address): Promise<void>;
  update(address: Address): Promise<void>;
  unsetDefaultForUser(userId: string): Promise<void>;
}

export const ADDRESS_REPOSITORY = Symbol('IAddressRepository');
