import { PrismaClient } from '../src/generated/prisma';
const prisma = new PrismaClient();

async function run() {
  const newStudent = await prisma.user.create({
    data: {
      email: 'new.test.student@example.com',
      name: 'Unassigned Student',
      firstName: 'Unassigned',
      lastName: 'Student',
      department: 'IT',
      role: 'STUDENT',
      studentId: '2024-TEST-001'
    }
  });
  console.log('Created unassigned student:', newStudent.name);
}
run();
