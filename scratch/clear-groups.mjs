import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();
async function main() {
  await prisma.defenseSchedule.deleteMany({});
  await prisma.group.deleteMany({});
  console.log('Cleared all groups and schedules');
}
main().catch(console.error).finally(() => prisma.$disconnect());
