import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter } as any);

  const email = process.env.ADMIN_EMAIL ?? 'admin@jocoso.cl';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin1234!Jocoso';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`Admin created: ${email}`);
  console.log('IMPORTANT: change the password after first login.');
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
