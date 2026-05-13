'use strict';

const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../generated/prisma'));
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');

const ADMINS = [
  'duquescalante@gmail.com',
  'aroken182@gmail.com',
  'admin@jocoso.cl',
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

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
