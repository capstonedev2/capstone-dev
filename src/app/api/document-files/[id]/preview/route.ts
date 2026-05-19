import { NextResponse } from 'next/server';
import { UserRole } from '@/generated/prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth';
import { getAuthorizedDocumentFile } from '@/lib/storage/document-authorization';
import { assertDocumentBucket, createSignedUrl } from '@/lib/storage/supabase-storage';
import { handleApiError } from '@/lib/utils';

export const runtime = 'nodejs';

const DOCUMENT_VIEWER_ROLES = [
  UserRole.STUDENT,
  UserRole.ADVISER,
  UserRole.PANEL,
  UserRole.RESEARCH_HEAD,
  UserRole.PROGRAM_HEAD,
  UserRole.SYSTEM_ADMIN,
  UserRole.ADMIN
];

function getInlineFileName(fileName: string) {
  return fileName.replace(/["\r\n]/g, '');
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthenticatedUser(request, DOCUMENT_VIEWER_ROLES);
    const { id } = await props.params;
    const file = await getAuthorizedDocumentFile(id, user);
    const bucketName = file.bucketName!;
    assertDocumentBucket(bucketName);

    const signedUrl = await createSignedUrl(bucketName, file.filePath!, 60);
    const upstream = await fetch(signedUrl);

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'Unable to load document preview' }, { status: 502 });
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': file.fileType || upstream.headers.get('content-type') || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${getInlineFileName(file.fileName)}"`,
        'Cache-Control': 'private, max-age=60',
        ...(upstream.headers.get('content-length')
          ? { 'Content-Length': upstream.headers.get('content-length')! }
          : {})
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
