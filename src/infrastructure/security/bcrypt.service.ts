import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const ROUNDS = 12;

@Injectable()
export class BcryptService {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, ROUNDS);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
