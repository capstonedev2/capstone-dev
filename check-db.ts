import { config } from 'dotenv';
config();
import { prisma } from './src/lib/prisma';

async function main() {
  const group = await prisma.group.findFirst({
    where: { code: 'IT-2026-01' },
    include: {
      groupMembers: {
        include: { user: true }
      }
    }
  });

  if (!group) return console.log('Group not found');

  const emails = group.groupMembers.map(m => ({
    name: m.user.name,
    email: m.user.email,
    isActive: m.isActive
  }));

  console.log('Student Emails:', emails);
}

main().catch(console.error).finally(() => prisma.$disconnect());
