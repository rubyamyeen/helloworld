'use client';

import { useState } from 'react';

type CaptionWithImage = {
  id: string;
  content: string;
  image_url: string | null;
};

type UserVotes = Record<string, number>;

type CaptionViewerProps = {
  captions: CaptionWithImage[];
  isAuthenticated: boolean;
  initialVotes: UserVotes;
};

export function CaptionViewer({ captions, isAuthenticated, initialVotes }: CaptionViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [votes, setVotes] = useState<UserVotes>(initialVotes);

  const currentCaption = captions[currentIndex];
  const currentVote = currentCaption ? votes[currentCaption.id] : undefined;
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

      // Update local vote state
      setVotes(prev => ({ ...prev, [currentCaption.id]: voteValue }));
      setIsVoting(false);

      // Only auto-advance if the vote actually changed
      if (data.changed) {
        advanceToNext();
      }
    } catch (err) {
      setError('Failed to vote');
      setIsVoting(false);
    }
  }

  if (!currentCaption) {
    return (
      <div className="text-center text-slate-500 dark:text-slate-400">
        No captions available
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Card */}
      <div className="glass-card rounded-2xl shadow-lg overflow-hidden mb-6">
        {/* Image */}
        <div className="aspect-video relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
          {currentCaption.image_url ? (
            <img
              src={currentCaption.image_url}
              alt="Caption image"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
              No image
            </div>
          )}
        </div>

        {/* Caption */}
        <div className="p-8">
          <p className="text-xl leading-relaxed text-slate-800 dark:text-slate-100 mb-6">
            {currentCaption.content}
          </p>

          {/* Error message */}
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
          )}

          {/* Voting */}
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleVote(1)}
                disabled={isVoting}
                className={`vote-btn vote-btn-up ${currentVote === 1 ? 'active' : ''}`}
                title="Upvote"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              </button>
              <button
                onClick={() => handleVote(-1)}
                disabled={isVoting}
                className={`vote-btn vote-btn-down ${currentVote === -1 ? 'active' : ''}`}
                title="Downvote"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                </svg>
              </button>
              {isVoting && (
                <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">...</span>
              )}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-sm">Sign in to vote</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrev}
          disabled={!hasPrev}
          className="px-5 py-2.5 glass-card rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
        >
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Previous
          </span>
        </button>

        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 tabular-nums">
          {currentIndex + 1} / {captions.length}
        </span>

        <button
          onClick={goToNext}
          disabled={!hasNext}
          className="px-5 py-2.5 glass-card rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
        >
          <span className="flex items-center gap-2">
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
