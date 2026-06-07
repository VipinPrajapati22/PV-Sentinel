import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db'
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@pvsystem.com';
  const password = 'Admin@1234';
  const roleName = 'Admin';

  console.log(`Ensuring demo user ${email} exists...`);

  let role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    role = await prisma.role.create({ data: { name: roleName, description: 'System Administrator with full access' } });
    console.log(`Created role: ${roleName}`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User ${email} already exists.`);
    if (!existing.active) {
      await prisma.user.update({ where: { email }, data: { active: true } });
      console.log(`Re-activated user ${email}.`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: 'Demo',
      lastName: 'Admin',
      roleId: role.id
    }
  });

  console.log(`Created demo user: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
