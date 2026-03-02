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
      <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === 'gallery'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Gallery
          {activeTab === 'gallery' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === 'generate'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Generate
          {activeTab === 'generate' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
          )}
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
