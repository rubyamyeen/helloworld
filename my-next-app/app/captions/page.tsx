import { createSupabaseServerClient } from '@/lib/supabase-server';
import { VoteButtons } from './vote-buttons';
import { SignInButton } from '../images/sign-in-button';
import { SignOutButton } from '../images/sign-out-button';

type Caption = {
  id: string;
  content: string;
  like_count: number | null;
  is_public: boolean;
};

async function getCaptions(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data, error } = await supabase
    .from('captions')
    .select('id, content, like_count, is_public')
    .order('created_datetime_utc', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Caption[], error: null };
}

export default async function CaptionsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  const { data: captions, error } = await getCaptions(supabase);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-red-800 text-lg font-semibold mb-2">Error Loading Captions</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!captions || captions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <Header user={user} />
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-6 text-center">
            <h2 className="text-gray-800 text-lg font-semibold mb-2">No Captions Found</h2>
            <p className="text-gray-600">There are no captions in the database yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <Header user={user} />

        {!isAuthenticated && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <p className="text-yellow-800">Sign in to vote on captions</p>
          </div>
        )}

        <div className="space-y-4">
          {captions.map((caption) => (
            <div
              key={caption.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <p className="text-gray-900 mb-3">{caption.content}</p>

              <div className="flex items-center justify-between">
                <VoteButtons captionId={caption.id} isAuthenticated={isAuthenticated} />

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {caption.like_count !== null && (
                    <span>{caption.like_count} likes</span>
                  )}
                  {caption.is_public && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      Public
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Header({ user }: { user: { email?: string } | null }) {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold text-gray-900">Captions</h1>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-gray-600">{user.email}</span>
            <SignOutButton />
          </>
        ) : (
          <SignInButton />
        )}
      </div>
    </div>
  );
}
