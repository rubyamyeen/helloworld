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

    // Query existing vote for this user+caption
    const { data: existingVotes, error: queryError } = await supabase
      .from('caption_votes')
      .select('id, vote_value')
      .eq('profile_id', user.id)
      .eq('caption_id', captionId)
      .limit(1);

    if (queryError) {
      return NextResponse.json(
        { error: queryError.message },
        { status: 500 }
      );
    }

    const existingVote = existingVotes?.[0];

    // If same vote already exists, return success without changing
    if (existingVote && existingVote.vote_value === voteValue) {
      return NextResponse.json({ ok: true, changed: false, voteValue });
    }

    // If vote exists but different value, UPDATE it
    if (existingVote) {
      const { error: updateError } = await supabase
        .from('caption_votes')
        .update({
          vote_value: voteValue,
          modified_datetime_utc: new Date().toISOString(),
        })
        .eq('id', existingVote.id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, changed: true, voteValue });
    }

    // No existing vote, INSERT new row
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

    return NextResponse.json({ ok: true, changed: true, voteValue });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to process vote request.' },
      { status: 500 }
    );
  }
}
