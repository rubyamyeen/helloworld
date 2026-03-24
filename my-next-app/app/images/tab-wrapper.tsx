'use client';

import { useState } from 'react';
import { CaptionViewer } from './caption-viewer';
import { GenerateTab } from './generate-tab';

type CaptionWithImage = {
  id: string;
  content: string;
  image_url: string | null;
};

type UserVotes = Record<string, number>;

type TabWrapperProps = {
  captions: CaptionWithImage[];
  isAuthenticated: boolean;
  initialVotes: UserVotes;
};

type Tab = 'gallery' | 'generate';

export function TabWrapper({ captions, isAuthenticated, initialVotes }: TabWrapperProps) {
  const [activeTab, setActiveTab] = useState<Tab>('gallery');

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-1 mb-8 p-1.5 glass-card rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('gallery')}
          className={`tab-button ${activeTab === 'gallery' ? 'active' : ''}`}
        >
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Gallery
          </span>
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className={`tab-button ${activeTab === 'generate' ? 'active' : ''}`}
        >
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1"/>
            </svg>
            Generate
          </span>
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'gallery' ? (
        <CaptionViewer
          captions={captions}
          isAuthenticated={isAuthenticated}
          initialVotes={initialVotes}
        />
      ) : (
        <GenerateTab onViewGallery={() => setActiveTab('gallery')} />
      )}
    </div>
  );
}
