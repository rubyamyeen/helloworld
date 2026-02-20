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
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentCaption = captions[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < captions.length - 1;

  function goToPrev() {
    if (hasPrev) {
      setCurrentIndex(currentIndex - 1);
      setError(null);
    }
  }

  function goToNext() {
    if (hasNext) {
      setCurrentIndex(currentIndex + 1);
      setError(null);
    }
  }

  function advanceToNext() {
    // Auto-advance: wrap around to 0 at the end
    if (currentIndex < captions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
    setError(null);
  }

  async function handleVote(voteValue: 1 | -1) {
    if (!isAuthenticated || isVoting) return;

    setIsVoting(true);
    setError(null);

    try {
      const response = await fetch('/api/caption-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captionId: currentCaption.id, voteValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to vote');
        setIsVoting(false);
        return;
      }

      // Success - auto-advance to next
      setIsVoting(false);
      advanceToNext();
    } catch (err) {
      setError('Failed to vote');
      setIsVoting(false);
    }
  }

  if (!currentCaption) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        No captions available
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-4">
        {/* Image */}
        <div className="aspect-video relative bg-gray-200 dark:bg-gray-700">
          {currentCaption.image_url ? (
            <img
              src={currentCaption.image_url}
              alt="Caption image"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
              No image
            </div>
          )}
        </div>

        {/* Caption */}
        <div className="p-6">
          <p className="text-lg text-gray-900 dark:text-gray-100 mb-4">
            {currentCaption.content}
          </p>

          {/* Error message */}
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
          )}

          {/* Voting */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleVote(1)}
                disabled={isVoting}
                className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                👍 Upvote
              </button>
              <button
                onClick={() => handleVote(-1)}
                disabled={isVoting}
                className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                👎 Downvote
              </button>
              {isVoting && (
                <span className="text-sm text-gray-500 dark:text-gray-400">Voting...</span>
              )}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sign in to vote</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrev}
          disabled={!hasPrev}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        <span className="text-gray-600 dark:text-gray-400">
          {currentIndex + 1} of {captions.length}
        </span>

        <button
          onClick={goToNext}
          disabled={!hasNext}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
