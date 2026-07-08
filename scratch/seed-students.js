const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function run() {
  const students = [
    { email: 'student.alice@test.com', name: 'Alice Smith', firstName: 'Alice', lastName: 'Smith', department: 'ICT', role: 'STUDENT', studentId: '2024-001' },
    { email: 'student.bob@test.com', name: 'Bob Johnson', firstName: 'Bob', lastName: 'Johnson', department: 'ICT', role: 'STUDENT', studentId: '2024-002' },
    { email: 'student.charlie@test.com', name: 'Charlie Davis', firstName: 'Charlie', lastName: 'Davis', department: 'ICT', role: 'STUDENT', studentId: '2024-003' },
    { email: 'student.diana@test.com', name: 'Diana Evans', firstName: 'Diana', lastName: 'Evans', department: 'ICT', role: 'STUDENT', studentId: '2024-004' }
  ];

  let count = 0;
  for (const s of students) {
    const exists = await prisma.user.findUnique({ where: { email: s.email } });
    if (!exists) {
      await prisma.user.create({ data: s });
      count++;
    }
  }
  
  console.log(`Successfully added ${count} available students for testing!`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
