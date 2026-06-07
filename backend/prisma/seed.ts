/**
 * Prisma seed — creates a default "Hub" user for testing.
 * Run with: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const hub = await prisma.user.upsert({
    where: { username: 'Hub' },
    update: {},
    create: { username: 'Hub' },
  });
  console.log('Seeded user:', hub);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
