import { config } from 'dotenv';
config();
import { prisma } from './src/lib/prisma';

async function main() {
  const group = await prisma.group.findFirst();
  if (!group) return console.log('No group found');

  const p = await prisma.project.create({
    data: {
      id: group.projectId || undefined,
      title: group.projectTitle,
      status: 'SUBMITTED',
      groupId: group.id,
      ownerId: group.leader ? await getUserIdByName(group.leader) : undefined,
      adviserId: group.userId,
      departmentId: group.department
    }
  });

  console.log('Created missing project:', p);
}

async function getUserIdByName(name) {
  const u = await prisma.user.findFirst({ where: { name } });
  return u ? u.id : undefined;
}

main().catch(console.error).finally(() => prisma.$disconnect());
