'use client';

import { useState, useRef } from 'react';

type GenerateResult = {
  cdnUrl: string;
  imageId: string;
  captions: unknown;
};

type GenerateTabProps = {
  onViewGallery: () => void;
};

export function GenerateTab({ onViewGallery }: GenerateTabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  }

  function clearSelection() {
    setFile(null);
    setPreview(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || isUploading) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      setProgress('Getting upload URL...');

      const formData = new FormData();
      formData.append('file', file);

      setProgress('Uploading and generating captions...');

      const response = await fetch('/api/pipeline/generate-captions', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate captions');
      }

      setProgress('');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProgress('');
    } finally {
      setIsUploading(false);
    }
  }

  function renderCaptions(captions: unknown) {
    // Handle array of caption objects
    if (Array.isArray(captions)) {
      return (
        <ul className="space-y-3">
          {captions.map((caption, index) => {
            // If caption is an object with a content or text field
            const text = typeof caption === 'string'
              ? caption
              : caption?.content || caption?.text || caption?.caption || JSON.stringify(caption);
            return (
              <li key={index} className="caption-card">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 text-white text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      );
    }

    // Fallback: render as JSON
    return (
      <pre className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm overflow-auto text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
        {JSON.stringify(captions, null, 2)}
      </pre>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card-elevated rounded-3xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1"/>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
            Generate Captions
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Upload an image and let AI create captions for you
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Upload zone */}
          {!preview ? (
            <div className="mb-6">
              <label className="block">
                <div className="upload-zone rounded-2xl p-8 text-center cursor-pointer transition-all">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500 dark:text-violet-400">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    PNG, JPG, GIF, WEBP or HEIC
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="mb-6">
              <div className="relative aspect-video image-container rounded-2xl overflow-hidden">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={isUploading}
                  className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!file || isUploading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="spinner"></div>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1"/>
                </svg>
                Generate Captions
              </span>
            )}
          </button>
        </form>

        {/* Progress */}
        {progress && (
          <div className="mt-6 p-4 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/30">
            <p className="text-violet-700 dark:text-violet-300 text-sm flex items-center gap-3">
              <div className="spinner"></div>
              {progress}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Generated Captions
              </h3>
            </div>

            {/* Show uploaded image */}
            <div className="mb-5 aspect-video image-container rounded-2xl overflow-hidden">
              <img
                src={result.cdnUrl}
                alt="Uploaded image"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Captions */}
            <div className="mb-6">
              {renderCaptions(result.captions)}
            </div>

            {/* View in Gallery button */}
            <button
              type="button"
              onClick={onViewGallery}
              className="btn-secondary w-full"
            >
              <span className="flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                View in Gallery
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
