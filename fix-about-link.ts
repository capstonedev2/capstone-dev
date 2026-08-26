import { prisma } from './src/lib/prisma';

async function main() {
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'system.themeBranding' } });
  if (setting && setting.value) {
    const value = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
    if (value.navigation && value.navigation.links) {
      const aboutLink = value.navigation.links.find((l: any) => l.id === 'about');
      if (aboutLink && aboutLink.href === '/about') {
        aboutLink.href = '/#about';
        await prisma.systemSetting.update({
          where: { key: 'system.themeBranding' },
          data: { value: value }
        });
        console.log('Database updated!');
      } else {
        console.log('Link already correct or not found in DB.');
      }
    }
  } else {
    console.log('No custom branding found in DB.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
