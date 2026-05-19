import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IAddressRepository } from '../../domain/auth/repositories/address.repository';
import { Address, AddressProps } from '../../domain/auth/entities/address.entity';

@Injectable()
export class AddressPrismaRepository implements IAddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Address | null> {
    const row = await this.prisma.address.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByUserId(userId: string): Promise<Address[]> {
    const rows = await this.prisma.address.findMany({
      where: { userId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return rows.map((r) => this.toEntity(r));
  }

  async save(address: Address): Promise<void> {
    const d = address.toPersistence();
    await this.prisma.address.create({
      data: {
        id: d.id, userId: d.userId, alias: d.alias,
        fullName: d.fullName, rut: d.rut, phone: d.phone,
        region: d.region, ciudad: d.ciudad, comuna: d.comuna,
        calle: d.calle, numero: d.numero, depto: d.depto,
        referencia: d.referencia, isDefault: d.isDefault, isActive: d.isActive,
      },
    });
  }

  async update(address: Address): Promise<void> {
    const d = address.toPersistence();
    await this.prisma.address.update({
      where: { id: d.id },
      data: {
        alias: d.alias, fullName: d.fullName, rut: d.rut, phone: d.phone,
        region: d.region, ciudad: d.ciudad, comuna: d.comuna,
        calle: d.calle, numero: d.numero, depto: d.depto,
        referencia: d.referencia, isDefault: d.isDefault, isActive: d.isActive,
      },
    });
  }

  async unsetDefaultForUser(userId: string): Promise<void> {
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  private toEntity(row: any): Address {
    return Address.reconstitute({
      id: row.id, userId: row.userId, alias: row.alias,
      fullName: row.fullName, rut: row.rut, phone: row.phone,
      region: row.region, ciudad: row.ciudad, comuna: row.comuna,
      calle: row.calle, numero: row.numero,
      depto: row.depto ?? null, referencia: row.referencia ?? null,
      isDefault: row.isDefault, isActive: row.isActive,
      createdAt: row.createdAt, updatedAt: row.updatedAt,
    } as AddressProps);
  }
}
