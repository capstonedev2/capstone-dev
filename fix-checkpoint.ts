import { prisma } from './src/lib/prisma';

async function main() {
  const file = await prisma.uploadedFile.findFirst({
    where: { fileName: { contains: 'THESIS INVENTORY PROPOSAL.docx' } },
    include: { project: true }
  });

  if (!file) {
    console.log('File not found');
    return;
  }

  console.log(`Found file: ${file.fileName} with ID ${file.id}`);

  // Find the concept paper checkpoint
  const conceptCheckpoint = await prisma.milestoneCheckpoint.findFirst({
    where: { projectId: file.projectId!, key: 'concept-paper' }
  });

  if (conceptCheckpoint) {
    await prisma.uploadedFile.update({
      where: { id: file.id },
      data: {
        documentCategory: 'Title Proposal',
        category: 'Title Proposal',
        checkpointId: conceptCheckpoint.id
      }
    });

    console.log(`Successfully moved file ${file.fileName} to Concept Paper (Stage 1)`);
  } else {
    console.log('Concept paper checkpoint not found for project', file.projectId);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
