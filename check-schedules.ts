import { config } from 'dotenv';
config();
import { prisma } from './src/lib/prisma';

async function main() {
  const items = await prisma.adviserScheduleItem.findMany({
    include: { project: true }
  });
  console.log('Schedules:', JSON.stringify(items, null, 2));

  const projects = await prisma.project.findMany();
  console.log('Projects:', JSON.stringify(projects, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
