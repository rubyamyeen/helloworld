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
              <li
                key={index}
                className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-slate-800 dark:text-slate-100 leading-relaxed"
              >
                {text}
              </li>
            );
          })}
        </ul>
      );
    }

    // Fallback: render as JSON
    return (
      <pre className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm overflow-auto text-slate-800 dark:text-slate-100">
        {JSON.stringify(captions, null, 2)}
      </pre>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-medium text-slate-900 dark:text-slate-100 mb-3 tracking-tight">
          Generate Captions
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Upload an image to generate captions using AI.
        </p>

        <form onSubmit={handleSubmit}>
          {/* File picker */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
              onChange={handleFileChange}
              disabled={isUploading}
              className="block w-full text-sm text-slate-500 dark:text-slate-400
                file:mr-4 file:py-2.5 file:px-5
                file:rounded-xl file:border-0
                file:text-sm file:font-medium
                file:bg-slate-100 file:text-slate-700
                dark:file:bg-slate-700 dark:file:text-slate-300
                hover:file:bg-slate-200 dark:hover:file:bg-slate-600
                file:cursor-pointer file:transition-colors
                disabled:opacity-50"
            />
          </div>

          {/* Preview */}
          {preview && (
            <div className="mb-6">
              <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl overflow-hidden">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <button
                type="button"
                onClick={clearSelection}
                disabled={isUploading}
                className="mt-3 text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
              >
                Clear selection
              </button>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!file || isUploading}
            className="w-full py-3.5 px-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium rounded-xl
              hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors"
          >
            {isUploading ? 'Processing...' : 'Upload & Generate Captions'}
          </button>
        </form>

        {/* Progress */}
        {progress && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-slate-700/50 rounded-xl">
            <p className="text-slate-700 dark:text-slate-300 text-sm flex items-center gap-3">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-300 border-t-blue-600 dark:border-slate-500 dark:border-t-slate-200 rounded-full"></span>
              {progress}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/50">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
              Generated Captions
            </h3>

            {/* Show uploaded image */}
            <div className="mb-5 aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl overflow-hidden">
              <img
                src={result.cdnUrl}
                alt="Uploaded image"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Captions */}
            <div className="mb-5">
              {renderCaptions(result.captions)}
            </div>

            {/* View in Gallery button */}
            <button
              type="button"
              onClick={onViewGallery}
              className="w-full py-3 px-4 glass-card text-slate-700 dark:text-slate-300
                font-medium rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
            >
              View in Gallery
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
