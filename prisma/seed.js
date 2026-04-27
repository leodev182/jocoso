'use strict';

const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../dist/generated/prisma/client'));
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const email = process.env.ADMIN_EMAIL ?? 'admin@jocoso.cl';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin1234!Jocoso';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email, passwordHash, role: 'ADMIN' } });

  console.log(`Admin created: ${email}`);
  console.log('IMPORTANT: change the password after first login.');
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
