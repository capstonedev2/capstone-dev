import { getAuthenticatedUser, toPublicUser } from '@/lib/auth';
import { HttpError, handleApiError, successResponse } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      throw new HttpError('Authentication is required.', 401);
    }

    return successResponse({
      user: toPublicUser(user)
    });
  } catch (error) {
    return handleApiError(error);
  }
}
