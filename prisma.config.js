'use strict';
// Production-only config (no ts-node required).
// prisma.config.ts is used for local development.
const { defineConfig } = require('prisma/config');

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL },
});
