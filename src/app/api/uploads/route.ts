import { uploadBufferToCloudinary } from '@/lib/cloudinary';
import { requireAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  HttpError,
  handleApiError,
  normalizeText,
  successResponse
} from '@/lib/utils';

export const runtime = 'nodejs';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function sanitizeFolder(value: unknown) {
  const folder = normalizeText(value);

  if (!folder) {
    return 'thesistrack/uploads';
  }

  return folder.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/\/{2,}/g, '/');
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      throw new HttpError('Please attach a file to upload.', 400, {
        file: 'A file is required.'
      });
    }

    if (file.size <= 0) {
      throw new HttpError('The selected file is empty.', 400, {
        file: 'Choose a non-empty file.'
      });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      throw new HttpError('File size must be 25 MB or smaller.', 413, {
        file: 'Choose a file up to 25 MB.'
      });
    }

    const folder = sanitizeFolder(formData.get('folder'));
    const category = normalizeText(formData.get('category')) || 'Uncategorized';
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadBufferToCloudinary(buffer, {
      folder,
      use_filename: true,
      unique_filename: true
    });

    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        secureUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        fileName: file.name,
        fileType: file.type || uploadResult.resource_type || 'application/octet-stream',
        resourceType: uploadResult.resource_type,
        category,
        size: uploadResult.bytes,
        userId: user.id
      }
    });

    return successResponse(
      {
        file: {
          id: uploadedFile.id,
          secureUrl: uploadedFile.secureUrl,
          publicId: uploadedFile.publicId,
          fileName: uploadedFile.fileName,
          fileType: uploadedFile.fileType,
          resourceType: uploadedFile.resourceType,
          category: uploadedFile.category,
          size: uploadedFile.size,
          userId: uploadedFile.userId,
          createdAt: uploadedFile.createdAt
        }
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
