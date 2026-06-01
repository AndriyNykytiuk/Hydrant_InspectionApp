import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const brigadeName = process.env.SEED_BRIGADE_NAME || 'Частина №1';
  const godEmail = process.env.SEED_GOD_EMAIL || 'god@example.com';
  const godPassword = process.env.SEED_GOD_PASSWORD || 'changeme123';
  const godName = process.env.SEED_GOD_NAME || 'Адміністратор';

  const brigade = await prisma.brigade.upsert({
    where: { name: brigadeName },
    update: {},
    create: { name: brigadeName },
  });

  const existing = await prisma.user.findUnique({ where: { email: godEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(godPassword, 10);
    await prisma.user.create({
      data: {
        email: godEmail,
        passwordHash,
        fullName: godName,
        role: 'god',
        brigadeId: brigade.id,
      },
    });
    console.log(`Seeded god user: ${godEmail} / ${godPassword}`);
  } else {
    console.log(`God user ${godEmail} already exists, skipping`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
