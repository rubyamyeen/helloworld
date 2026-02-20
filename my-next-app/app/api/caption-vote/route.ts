import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function createSupabaseRouteClient() {
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
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to vote.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { captionId, voteValue } = body;

    // Validate captionId
    if (!captionId || typeof captionId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid captionId. Must be a non-empty string.' },
        { status: 400 }
      );
    }

    // Validate voteValue
    if (voteValue !== 1 && voteValue !== -1) {
      return NextResponse.json(
        { error: 'Invalid voteValue. Must be 1 (upvote) or -1 (downvote).' },
        { status: 400 }
      );
    }

    // Insert vote into caption_votes
    const { error: insertError } = await supabase
      .from('caption_votes')
      .insert({
        vote_value: voteValue,
        profile_id: user.id,
        caption_id: captionId,
        created_datetime_utc: new Date().toISOString(),
      });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Vote recorded successfully.' });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to process vote request.' },
      { status: 500 }
    );
  }
}
