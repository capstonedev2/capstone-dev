import { PrismaClient } from './src/generated/prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.mofstfwvfigafyucpoti:ZKUgnwGBu9UHVDR8@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
    }
  }
});

async function main() {
  console.log('Connecting to database...');
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'system.themeBranding' }
  });

  if (setting && setting.value) {
    const branding = setting.value as any;
    
    console.log('Current tagline:', branding.tagline);
    
    // Update the taglines
    branding.tagline = 'Higher Education Institutions';
    if (branding.shell) {
      branding.shell.navbarSubtitle = 'Higher Education Institutions';
    }
    
    await prisma.systemSetting.update({
      where: { key: 'system.themeBranding' },
      data: { value: branding }
    });
    
    console.log('Database branding updated successfully.');
  } else {
    console.log('No branding setting found in DB.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
