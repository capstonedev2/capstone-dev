import { Prisma, UserRole } from '@/generated/prisma/client';
import {
  BRANDING_SETTING_KEY,
  DEFAULT_BRANDING,
  sanitizeBrandingSettings
} from '@/lib/branding';
import { requireAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  HttpError,
  handleApiError,
  parseJsonBody,
  successResponse
} from '@/lib/utils';

export const runtime = 'nodejs';

type BrandingRequestBody = {
  branding?: unknown;
};

async function readBrandingSetting() {
  const setting = await prisma.systemSetting.findUnique({
    where: {
      key: BRANDING_SETTING_KEY
    }
  });

  return sanitizeBrandingSettings(setting?.value);
}

async function saveBrandingSetting(brandingInput: unknown, actorId?: string) {
  const branding = {
    ...sanitizeBrandingSettings(brandingInput),
    updatedAt: new Date().toISOString()
  };

  const setting = await prisma.systemSetting.upsert({
    where: {
      key: BRANDING_SETTING_KEY
    },
    create: {
      key: BRANDING_SETTING_KEY,
      scope: 'global',
      description: 'Global system theme and branding settings.',
      value: branding as unknown as Prisma.InputJsonValue
    },
    update: {
      description: 'Global system theme and branding settings.',
      value: branding as unknown as Prisma.InputJsonValue
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: 'system_branding.updated',
      entityType: 'SystemSetting',
      entityId: setting.id,
      metadata: {
        key: BRANDING_SETTING_KEY,
        systemName: branding.systemName,
        themePreset: branding.themePreset
      } as Prisma.InputJsonValue
    }
  });

  return branding;
}

export async function GET() {
  try {
    const branding = await readBrandingSetting();

    return successResponse({
      branding,
      defaultBranding: DEFAULT_BRANDING
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request, [UserRole.SYSTEM_ADMIN]);
    const body = await parseJsonBody<BrandingRequestBody>(request);

    if (!body || !('branding' in body)) {
      throw new HttpError('Branding settings are required.', 400);
    }

    const branding = await saveBrandingSetting(body.branding, user.id);

    return successResponse({
      message: 'Branding settings saved successfully.',
      branding
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request, [UserRole.SYSTEM_ADMIN]);
    const branding = await saveBrandingSetting(DEFAULT_BRANDING, user.id);

    return successResponse({
      message: 'Default branding restored successfully.',
      branding
    });
  } catch (error) {
    return handleApiError(error);
  }
}
