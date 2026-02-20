import { createSupabaseServerClient } from '@/lib/supabase-server';
import { SignInButton } from './sign-in-button';
import { SignOutButton } from './sign-out-button';
import { CaptionViewer } from './caption-viewer';
import { DarkModeToggle } from './dark-mode-toggle';

type CaptionWithImage = {
  id: string;
  content: string;
  image_url: string | null;
};

type UserVotes = Record<string, number>; // captionId -> voteValue (1 or -1)

async function getCaptionsWithImages(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data, error } = await supabase
    .from('captions')
    .select(`
      id,
      content,
      images ( url )
    `)
    .order('created_datetime_utc', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  const captions: CaptionWithImage[] = (data || []).map((caption: any) => ({
    id: caption.id,
    content: caption.content,
    image_url: caption.images?.url || null,
  }));

  return { data: captions, error: null };
}

async function getUserVotes(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  captionIds: string[]
): Promise<UserVotes> {
  if (captionIds.length === 0) return {};

  // Get latest vote for each caption by this user
  // We'll fetch all votes and then pick the latest per caption
  const { data, error } = await supabase
    .from('caption_votes')
    .select('caption_id, vote_value, created_datetime_utc')
    .eq('profile_id', userId)
    .in('caption_id', captionIds)
    .order('created_datetime_utc', { ascending: false });

  if (error || !data) return {};

  // Get latest vote per caption
  const votes: UserVotes = {};
  for (const vote of data) {
    if (!(vote.caption_id in votes)) {
      votes[vote.caption_id] = vote.vote_value;
    }
  }

  return votes;
}

export default async function ImagesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  // Gated UI - show sign in if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 max-w-md text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Caption Gallery</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Sign in to view and vote on captions.</p>
          <SignInButton />
        </div>
      </div>
    );
  }

  // Authenticated - fetch captions with images
  const { data: captions, error } = await getCaptionsWithImages(supabase);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-red-800 dark:text-red-400 text-lg font-semibold mb-2">Error Loading Captions</h2>
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!captions || captions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Header user={user} />
          <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
            <h2 className="text-gray-800 dark:text-gray-200 text-lg font-semibold mb-2">No Captions Found</h2>
            <p className="text-gray-600 dark:text-gray-400">There are no captions in the database yet.</p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch user's existing votes
  const captionIds = captions.map(c => c.id);
  const userVotes = await getUserVotes(supabase, user.id, captionIds);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Header user={user} />
        <CaptionViewer
          captions={captions}
          isAuthenticated={isAuthenticated}
          initialVotes={userVotes}
        />
      </div>
    </div>
  );
}

function Header({ user }: { user: { email?: string } | null }) {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Caption Gallery</h1>
      <div className="flex items-center gap-4">
        <DarkModeToggle />
        {user && (
          <>
            <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
            <SignOutButton />
          </>
        )}
      </div>
    </div>
  );
}
