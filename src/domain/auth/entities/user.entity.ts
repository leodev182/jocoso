import * as crypto from 'crypto';

export enum Role {
  ADMIN = 'ADMIN',
  SUPPORT = 'SUPPORT',
  CUSTOMER = 'CUSTOMER',
}

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  twoFactorSecret: string | null;
  twoFactorEnabled: boolean;
  createdAt: Date;
}

export class User {
  private constructor(
    private readonly id: string,
    private readonly email: string,
    private readonly passwordHash: string,
    private readonly role: Role,
    private twoFactorSecret: string | null,
    private twoFactorEnabled: boolean,
    private readonly createdAt: Date,
  ) {}

  static create(email: string, passwordHash: string): User {
    return new User(
      crypto.randomUUID(),
      email.toLowerCase(),
      passwordHash,
      Role.CUSTOMER,
      null,
      false,
      new Date(),
    );
  }

  static reconstitute(props: UserProps): User {
    return new User(
      props.id,
      props.email,
      props.passwordHash,
      props.role,
      props.twoFactorSecret,
      props.twoFactorEnabled,
      props.createdAt,
    );
  }

  getId(): string { return this.id; }
  getEmail(): string { return this.email; }
  getPasswordHash(): string { return this.passwordHash; }
  getRole(): Role { return this.role; }
  getTwoFactorSecret(): string | null { return this.twoFactorSecret; }
  isTwoFactorEnabled(): boolean { return this.twoFactorEnabled; }

  setTwoFactorSecret(secret: string): void {
    this.twoFactorSecret = secret;
  }

  enableTwoFactor(): void {
    if (!this.twoFactorSecret) throw new Error('2FA secret must be set before enabling');
    this.twoFactorEnabled = true;
  }

  toPersistence(): UserProps {
    return {
      id: this.id,
      email: this.email,
      passwordHash: this.passwordHash,
      role: this.role,
      twoFactorSecret: this.twoFactorSecret,
      twoFactorEnabled: this.twoFactorEnabled,
      createdAt: this.createdAt,
    };
  }
}
