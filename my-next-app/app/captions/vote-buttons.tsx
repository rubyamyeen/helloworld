'use client';

import { useState } from 'react';

type VoteButtonsProps = {
  captionId: string;
  isAuthenticated: boolean;
};

export function VoteButtons({ captionId, isAuthenticated }: VoteButtonsProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  async function handleVote(voteValue: 1 | -1) {
    if (!isAuthenticated) {
      setStatus('error');
      setMessage('Sign in to vote');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/caption-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captionId, voteValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || 'Failed to vote');
        return;
      }

      setStatus('success');
      setMessage('Voted!');

      // Reset after 2 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 2000);
    } catch (err) {
      setStatus('error');
      setMessage('Failed to vote');
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleVote(1)}
        disabled={status === 'loading' || !isAuthenticated}
        className="px-3 py-1 text-sm font-medium bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={isAuthenticated ? 'Upvote' : 'Sign in to vote'}
      >
        👍
      </button>
      <button
        onClick={() => handleVote(-1)}
        disabled={status === 'loading' || !isAuthenticated}
        className="px-3 py-1 text-sm font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={isAuthenticated ? 'Downvote' : 'Sign in to vote'}
      >
        👎
      </button>
      {message && (
        <span className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </span>
      )}
    </div>
  );
}
