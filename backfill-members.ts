import { config } from 'dotenv';
config();
import { prisma } from './src/lib/prisma';

function normalizeStudentName(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').toLowerCase() : '';
}

async function main() {
  const groups = await prisma.group.findMany();
  const users = await prisma.user.findMany({
    where: { role: 'STUDENT' }
  });

  let linkedCount = 0;

  for (const group of groups) {
    if (!group.students || group.students.length === 0) continue;

    const newMembers = [];
    for (const studentName of group.students) {
      const normalizedQuery = normalizeStudentName(studentName);
      
      const matchedUser = users.find(u => {
        const candidateNames = [
          u.name,
          u.displayName,
          [u.firstName, u.lastName].filter(Boolean).join(' ')
        ].map(normalizeStudentName).filter(Boolean);
        return candidateNames.includes(normalizedQuery);
      });

      if (matchedUser) {
        newMembers.push({
          userId: matchedUser.id,
          isActive: true,
          role: normalizeStudentName(group.leader) === normalizedQuery ? 'LEADER' : 'MEMBER'
        });
      }
    }

    if (newMembers.length > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.groupMember.deleteMany({ where: { groupId: group.id } });
        await tx.group.update({
          where: { id: group.id },
          data: {
            groupMembers: {
              create: newMembers
            }
          }
        });
      });
      linkedCount += newMembers.length;
    }
  }

  console.log(`Successfully auto-linked ${linkedCount} student accounts to existing groups!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
