import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const ADMINS = [
  'duquescalante@gmail.com',
  'aroken182@gmail.com',
  'admin@jocoso.cl',
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter } as any);

  const password = process.env.ADMIN_PASSWORD ?? 'Admin1234!Jocoso';
  const passwordHash = await bcrypt.hash(password, 12);

  for (const email of ADMINS) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`Already exists: ${email}`);
      continue;
    }
    await prisma.user.create({ data: { email, passwordHash, role: 'ADMIN' } });
    console.log(`Admin created: ${email}`);
  }

  console.log('IMPORTANT: change passwords after first login.');
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
