import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
];

const API_BASE = 'https://api.almostcrackd.ai';

async function createSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from Server Component - ignore
          }
        },
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    // Get authenticated session
    const supabase = await createSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      );
    }

    const accessToken = session.access_token;

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Step 1: Get presigned URL
    const presignedResponse = await fetch(`${API_BASE}/pipeline/generate-presigned-url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contentType: file.type }),
    });

    if (!presignedResponse.ok) {
      const errorText = await presignedResponse.text();
      console.error('Presigned URL error:', errorText);
      return NextResponse.json(
        { error: `Failed to get presigned URL: ${presignedResponse.status}` },
        { status: 500 }
      );
    }

    const { presignedUrl, cdnUrl } = await presignedResponse.json();

    // Step 2: Upload file to presigned URL
    const fileBuffer = await file.arrayBuffer();
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload error:', errorText);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadResponse.status}` },
        { status: 500 }
      );
    }

    // Step 3: Register image with AlmostCrackd
    const registerResponse = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: cdnUrl,
        isCommonUse: false,
      }),
    });

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      console.error('Register image error:', errorText);
      return NextResponse.json(
        { error: `Failed to register image: ${registerResponse.status}` },
        { status: 500 }
      );
    }

    const { imageId } = await registerResponse.json();

    // Step 4: Generate captions
    const captionsResponse = await fetch(`${API_BASE}/pipeline/generate-captions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageId }),
    });

    if (!captionsResponse.ok) {
      const errorText = await captionsResponse.text();
      console.error('Generate captions error:', errorText);
      return NextResponse.json(
        { error: `Failed to generate captions: ${captionsResponse.status}` },
        { status: 500 }
      );
    }

    const captions = await captionsResponse.json();

    return NextResponse.json({
      cdnUrl,
      imageId,
      captions,
    });
  } catch (error) {
    console.error('Pipeline error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
