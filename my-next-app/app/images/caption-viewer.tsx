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

// Image component with loading and error states
function ImageWithFallback({
  src,
  alt
}: {
  src: string | null;
  alt: string;
}) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');

  if (!src) {
    return (
      <div className="image-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2 opacity-60">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span className="text-sm">No image available</span>
      </div>
    );
  }

  return (
    <>
      {imageState === 'loading' && (
        <div className="image-placeholder image-loading absolute inset-0">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-50">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      )}
      {imageState === 'error' ? (
        <div className="image-placeholder">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2 opacity-60">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="3" x2="21" y2="21"/>
          </svg>
          <span className="text-sm">Failed to load image</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageState('loaded')}
          onError={() => setImageState('error')}
        />
      )}
    </>
  );
}

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
      <div className="text-center py-16">
        <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400 dark:text-slate-500">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
        <p className="text-slate-600 dark:text-slate-400 font-medium">No captions available</p>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Upload an image to get started</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Card */}
      <div className="card-elevated rounded-2xl overflow-hidden mb-6">
        {/* Image */}
        <div className="aspect-video relative image-container" key={currentCaption.id}>
          <ImageWithFallback
            src={currentCaption.image_url}
            alt="Caption image"
          />
        </div>

        {/* Caption */}
        <div className="p-5 sm:p-6">
          <p className="text-base sm:text-lg leading-relaxed text-slate-700 dark:text-slate-200 mb-5">
            {currentCaption.content}
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Voting */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleVote(1)}
                disabled={isVoting}
                className={`vote-btn vote-btn-up ${currentVote === 1 ? 'active' : ''}`}
                title="Upvote"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              </button>
              <button
                onClick={() => handleVote(-1)}
                disabled={isVoting}
                className={`vote-btn vote-btn-down ${currentVote === -1 ? 'active' : ''}`}
                title="Downvote"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                </svg>
              </button>
              {isVoting && (
                <div className="spinner ml-2"></div>
              )}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-sm">Sign in to vote</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={goToPrev}
          disabled={!hasPrev}
          className="flex-1 sm:flex-none px-4 py-2.5 glass-card rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium"
        >
          <span className="flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span className="hidden sm:inline">Previous</span>
          </span>
        </button>

        <div className="px-3 py-1.5 glass-card rounded-lg">
          <span className="text-sm font-medium tabular-nums" style={{ color: 'var(--accent-primary)' }}>
            {currentIndex + 1}
          </span>
          <span className="text-sm text-slate-400 dark:text-slate-500 mx-1">/</span>
          <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
            {captions.length}
          </span>
        </div>

        <button
          onClick={goToNext}
          disabled={!hasNext}
          className="flex-1 sm:flex-none px-4 py-2.5 glass-card rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="hidden sm:inline">Next</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
