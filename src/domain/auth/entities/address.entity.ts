import * as crypto from 'crypto';

export interface AddressProps {
  id: string;
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
  depto: string | null;
  referencia: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Address {
  private constructor(
    private readonly id: string,
    private readonly userId: string,
    private alias: string,
    private fullName: string,
    private rut: string,
    private phone: string,
    private region: string,
    private ciudad: string,
    private comuna: string,
    private calle: string,
    private numero: string,
    private depto: string | null,
    private referencia: string | null,
    private isDefault: boolean,
    private isActive: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(props: Omit<AddressProps, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>): Address {
    const now = new Date();
    return new Address(
      crypto.randomUUID(), props.userId, props.alias, props.fullName,
      props.rut, props.phone, props.region, props.ciudad, props.comuna,
      props.calle, props.numero, props.depto ?? null, props.referencia ?? null,
      props.isDefault, true, now, now,
    );
  }

  static reconstitute(props: AddressProps): Address {
    return new Address(
      props.id, props.userId, props.alias, props.fullName,
      props.rut, props.phone, props.region, props.ciudad, props.comuna,
      props.calle, props.numero, props.depto, props.referencia,
      props.isDefault, props.isActive, props.createdAt, props.updatedAt,
    );
  }

  getId(): string { return this.id; }
  getUserId(): string { return this.userId; }
  getAlias(): string { return this.alias; }
  getFullName(): string { return this.fullName; }
  getRut(): string { return this.rut; }
  getPhone(): string { return this.phone; }
  getRegion(): string { return this.region; }
  getCiudad(): string { return this.ciudad; }
  getComuna(): string { return this.comuna; }
  getCalle(): string { return this.calle; }
  getNumero(): string { return this.numero; }
  getDepto(): string | null { return this.depto; }
  getReferencia(): string | null { return this.referencia; }
  getIsDefault(): boolean { return this.isDefault; }
  getIsActive(): boolean { return this.isActive; }

  setAsDefault(): void { this.isDefault = true; this.touch(); }
  unsetDefault(): void { this.isDefault = false; this.touch(); }
  deactivate(): void { this.isActive = false; this.touch(); }

  private touch(): void { this.updatedAt = new Date(); }

  toPersistence(): AddressProps {
    return {
      id: this.id, userId: this.userId, alias: this.alias,
      fullName: this.fullName, rut: this.rut, phone: this.phone,
      region: this.region, ciudad: this.ciudad, comuna: this.comuna,
      calle: this.calle, numero: this.numero, depto: this.depto,
      referencia: this.referencia, isDefault: this.isDefault,
      isActive: this.isActive, createdAt: this.createdAt, updatedAt: this.updatedAt,
    };
  }
}
