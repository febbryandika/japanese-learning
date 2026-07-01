import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

import { requireAdmin } from '@/lib/auth'

// Client-direct upload token route. The browser's `upload()` call posts here to
// mint a short-lived client token, then uploads the file straight to Vercel Blob
// (bypassing this server's body-size limit). Book metadata is persisted
// separately by the client via POST /api/admin/reader/books once upload resolves.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Auth lives here: the client's token request carries the admin session
        // cookies, whereas the onUploadCompleted webhook (skips this callback)
        // does not — guarding the whole route would reject that webhook.
        const guard = await requireAdmin()
        if (!guard.ok) {
          throw new Error('Forbidden')
        }
        return {
          allowedContentTypes: [
            'application/epub+zip',
            'application/octet-stream',
            'application/zip',
          ],
          maximumSizeInBytes: 50 * 1024 * 1024,
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async () => {
        // No-op: the client persists the book row after upload (this webhook does
        // not fire on localhost).
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 },
    )
  }
}
