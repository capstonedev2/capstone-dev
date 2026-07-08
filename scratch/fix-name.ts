import { prisma } from '../src/lib/prisma';

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true }});
  console.log('Users:', users);
  
  const groups = await prisma.group.findMany({ select: { id: true, students: true, leader: true }});
  console.log('Groups:', groups);
}

main().catch(console.error);
