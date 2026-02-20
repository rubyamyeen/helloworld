'use client';

import { useState } from 'react';

type CaptionWithImage = {
  id: string;
  content: string;
  image_url: string | null;
};

type CaptionViewerProps = {
  captions: CaptionWithImage[];
  isAuthenticated: boolean;
};

export function CaptionViewer({ captions, isAuthenticated }: CaptionViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voteStatus, setVoteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [voteMessage, setVoteMessage] = useState('');

  const currentCaption = captions[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < captions.length - 1;

  function goToPrev() {
    if (hasPrev) {
      setCurrentIndex(currentIndex - 1);
      resetVoteStatus();
    }
  }

  function goToNext() {
    if (hasNext) {
      setCurrentIndex(currentIndex + 1);
      resetVoteStatus();
    }
  }

  function resetVoteStatus() {
    setVoteStatus('idle');
    setVoteMessage('');
  }

  async function handleVote(voteValue: 1 | -1) {
    if (!isAuthenticated) return;

    setVoteStatus('loading');
    setVoteMessage('');

    try {
      const response = await fetch('/api/caption-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captionId: currentCaption.id, voteValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        setVoteStatus('error');
        setVoteMessage(data.error || 'Failed to vote');
        return;
      }

      setVoteStatus('success');
      setVoteMessage(voteValue === 1 ? 'Upvoted!' : 'Downvoted!');
    } catch (err) {
      setVoteStatus('error');
      setVoteMessage('Failed to vote');
    }
  }

  if (!currentCaption) {
    return (
      <div className="text-center text-gray-500">No captions available</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Image */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
        <div className="aspect-video relative bg-gray-200">
          {currentCaption.image_url ? (
            <img
              src={currentCaption.image_url}
              alt="Caption image"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
        </div>

        {/* Caption */}
        <div className="p-6">
          <p className="text-lg text-gray-900 mb-4">{currentCaption.content}</p>

          {/* Voting */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleVote(1)}
                disabled={voteStatus === 'loading'}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-colors font-medium"
              >
                👍 Upvote
              </button>
              <button
                onClick={() => handleVote(-1)}
                disabled={voteStatus === 'loading'}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors font-medium"
              >
                👎 Downvote
              </button>
              {voteMessage && (
                <span className={`text-sm ${voteStatus === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                  {voteMessage}
                </span>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Sign in to vote</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrev}
          disabled={!hasPrev}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        <span className="text-gray-600">
          {currentIndex + 1} of {captions.length}
        </span>

        <button
          onClick={goToNext}
          disabled={!hasNext}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
