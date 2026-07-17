const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function main() { 
  const users = await prisma.user.findMany({ 
    where: { department: { contains: 'tcm', mode: 'insensitive' } } 
  }); 
  console.log(users); 
} 
main().finally(() => prisma.$disconnect());
