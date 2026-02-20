import { createSupabaseServerClient } from '@/lib/supabase-server';
import { SignInButton } from './sign-in-button';
import { SignOutButton } from './sign-out-button';
import { CaptionViewer } from './caption-viewer';

type CaptionWithImage = {
  id: string;
  content: string;
  image_url: string | null;
};

async function getCaptionsWithImages(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  // Fetch captions with their related image URLs
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

  // Transform the data to flatten the image URL
  const captions: CaptionWithImage[] = (data || []).map((caption: any) => ({
    id: caption.id,
    content: caption.content,
    image_url: caption.images?.url || null,
  }));

  return { data: captions, error: null };
}

export default async function ImagesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  // Gated UI - show sign in if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Caption Gallery</h1>
          <p className="text-gray-600 mb-6">Sign in to view and vote on captions.</p>
          <SignInButton />
        </div>
      </div>
    );
  }

  // Authenticated - fetch captions with images
  const { data: captions, error } = await getCaptionsWithImages(supabase);

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

  if (!captions || captions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
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
      <div className="max-w-2xl mx-auto">
        <Header user={user} />
        <CaptionViewer captions={captions} isAuthenticated={isAuthenticated} />
      </div>
    </div>
  );
}

function Header({ user }: { user: { email?: string } | null }) {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold text-gray-900">Caption Gallery</h1>
      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm text-gray-600">{user.email}</span>
            <SignOutButton />
          </>
        )}
      </div>
    </div>
  );
}
