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
      <div className="flex gap-2 mb-8 p-1 glass-card rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-5 py-2.5 font-medium text-sm rounded-lg transition-all ${
            activeTab === 'gallery'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Gallery
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-5 py-2.5 font-medium text-sm rounded-lg transition-all ${
            activeTab === 'generate'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Generate
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
