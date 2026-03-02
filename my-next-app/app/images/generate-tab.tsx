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
        <ul className="space-y-2">
          {captions.map((caption, index) => {
            // If caption is an object with a content or text field
            const text = typeof caption === 'string'
              ? caption
              : caption?.content || caption?.text || caption?.caption || JSON.stringify(caption);
            return (
              <li
                key={index}
                className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
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
      <pre className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm overflow-auto text-gray-900 dark:text-gray-100">
        {JSON.stringify(captions, null, 2)}
      </pre>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Generate Captions
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Upload an image to generate captions using AI.
        </p>

        <form onSubmit={handleSubmit}>
          {/* File picker */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
              onChange={handleFileChange}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-blue-50 file:text-blue-700
                dark:file:bg-blue-900 dark:file:text-blue-300
                hover:file:bg-blue-100 dark:hover:file:bg-blue-800
                file:cursor-pointer file:transition-colors
                disabled:opacity-50"
            />
          </div>

          {/* Preview */}
          {preview && (
            <div className="mb-4">
              <div className="relative aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
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
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
              >
                Clear selection
              </button>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!file || isUploading}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg
              hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors"
          >
            {isUploading ? 'Processing...' : 'Upload & Generate Captions'}
          </button>
        </form>

        {/* Progress */}
        {progress && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-blue-700 dark:text-blue-300 text-sm flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              {progress}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
              Generated Captions
            </h3>

            {/* Show uploaded image */}
            <div className="mb-4 aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              <img
                src={result.cdnUrl}
                alt="Uploaded image"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Captions */}
            <div className="mb-4">
              {renderCaptions(result.captions)}
            </div>

            {/* View in Gallery button */}
            <button
              type="button"
              onClick={onViewGallery}
              className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              View in Gallery
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
