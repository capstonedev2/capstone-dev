import {
  publicUserSelect,
  requireAuthenticatedUser,
  toPublicUser
} from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  HttpError,
  handleApiError,
  normalizeText,
  parseJsonBody,
  successResponse
} from '@/lib/utils';

export const runtime = 'nodejs';

/**
 * GET /api/profile
 * Returns the authenticated user's full profile from the database.
 */
export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);

    return successResponse({
      user: toPublicUser(user)
    });
  } catch (error) {
    return handleApiError(error);
  }
}

type UpdateProfileBody = {
  name?: unknown;
  displayName?: unknown;
  contactNumber?: unknown;
  address?: unknown;
  birthDate?: unknown;
  profileImage?: unknown;
  section?: unknown;
  accountSummary?: unknown;
  office?: unknown;
};

/**
 * PATCH /api/profile
 * Allows an authenticated user to update their own profile fields.
 * Only profile-specific fields are editable here (not email, name, role, etc.).
 */
export async function PATCH(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);

    const body = await parseJsonBody<UpdateProfileBody>(request);

    const name = body.name !== undefined ? normalizeText(body.name) : undefined;
    const displayName = body.displayName !== undefined ? normalizeText(body.displayName) : undefined;
    const contactNumber = body.contactNumber !== undefined ? normalizeText(body.contactNumber) : undefined;
    const address = body.address !== undefined ? normalizeText(body.address) : undefined;
    const birthDate = body.birthDate !== undefined ? normalizeText(body.birthDate) : undefined;
    const profileImage = body.profileImage !== undefined ? String(body.profileImage ?? '') : undefined;
    const section = body.section !== undefined ? normalizeText(body.section) : undefined;
    const accountSummary = body.accountSummary !== undefined ? normalizeText(body.accountSummary) : undefined;
    const office = body.office !== undefined ? normalizeText(body.office) : undefined;

    // Build data object with only the fields that were actually sent
    const data: Record<string, string | null> = {};

    if (name !== undefined) data.name = name || null;
    if (displayName !== undefined) data.displayName = displayName || null;
    if (contactNumber !== undefined) data.contactNumber = contactNumber || null;
    if (address !== undefined) data.address = address || null;
    if (birthDate !== undefined) data.birthDate = birthDate || null;
    
    if (profileImage !== undefined) {
      if (profileImage && profileImage.startsWith('data:image/')) {
        try {
          const { uploadBufferToCloudinary } = await import('@/lib/cloudinary');
          const base64Data = profileImage.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          
          const uploadResult = await uploadBufferToCloudinary(buffer, {
            folder: 'thesistrack/profiles',
            use_filename: true,
            unique_filename: true
          });
          
          data.profileImage = uploadResult.secure_url;
        } catch (uploadError) {
          console.error('Failed to upload profile image to Cloudinary:', uploadError);
          throw new HttpError('Failed to upload profile image.', 500);
        }
      } else {
        data.profileImage = profileImage || null;
      }
    }
    if (section !== undefined) data.section = section || null;
    if (accountSummary !== undefined) data.accountSummary = accountSummary || null;
    if (office !== undefined) data.office = office || null;

    if (!Object.keys(data).length) {
      throw new HttpError('No profile fields were provided to update.', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data,
      select: publicUserSelect
    });

    return successResponse({
      message: 'Profile updated successfully.',
      user: toPublicUser(updatedUser)
    });
  } catch (error) {
    return handleApiError(error);
  }
}
