import { PrismaClient } from './src/generated/prisma/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findFirst({
    where: {
      name: { contains: 'salise', mode: 'insensitive' }
    }
  });
  console.log('User:', u);

  const projects = await prisma.project.findMany({
    include: { adviser: true, group: true }
  });
  console.log('Projects:', JSON.stringify(projects, null, 2));

  const groups = await prisma.group.findMany();
  console.log('Groups:', JSON.stringify(groups, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
