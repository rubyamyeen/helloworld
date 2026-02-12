import { createSupabaseServerClient } from '@/lib/supabase-server';
import { SignInButton } from './sign-in-button';
import { SignOutButton } from './sign-out-button';

type Image = {
  id: string;
  created_datetime_utc: string;
  modified_datetime_utc: string | null;
  url: string;
  is_common_use: boolean;
  profile_id: string;
  additional_context: string;
  is_public: boolean;
  image_description: string;
  celebrity_recognition: string;
};

async function getImages(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .order('created_datetime_utc', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Image[], error: null };
}

export default async function ImagesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Gated UI - show sign in if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Images</h1>
          <p className="text-gray-600 mb-6">Sign in to view the image gallery.</p>
          <SignInButton />
        </div>
      </div>
    );
  }

  // Authenticated - fetch and display images
  const { data: images, error } = await getImages(supabase);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-red-800 text-lg font-semibold mb-2">Error Loading Images</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Images</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <SignOutButton />
            </div>
          </div>
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-6 text-center">
            <h2 className="text-gray-800 text-lg font-semibold mb-2">No Images Found</h2>
            <p className="text-gray-600">There are no images in the database yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Images</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <SignOutButton />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((image) => (
            <div
              key={image.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square relative bg-gray-200">
                {image.url ? (
                  <img
                    src={image.url}
                    alt={image.image_description || 'Image'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>

              <div className="p-4">
                <p className="text-gray-900 font-medium text-sm line-clamp-2">
                  {image.image_description || image.additional_context || image.id}
                </p>

                <div className="mt-2 flex gap-2">
                  {image.is_public && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Public
                    </span>
                  )}
                  {image.is_common_use && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Common Use
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
