import { getAuthenticatedUser, toPublicUser } from '@/lib/auth';
import { HttpError, handleApiError, successResponse } from '@/lib/utils';
import { withApiLogging } from '@/lib/api-logging';

export const runtime = 'nodejs';

async function handleGET(request: Request) {
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

export const GET = withApiLogging('GET', '/api/auth/me', handleGET);
