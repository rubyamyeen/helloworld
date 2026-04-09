'use client';

import { useState, useRef, useCallback } from 'react';

type GenerateResult = {
  cdnUrl: string;
  imageId: string;
  captions: unknown;
};

type GenerateTabProps = {
  onViewGallery: () => void;
  onCaptionsGenerated?: (imageId: string) => void;
};

// Progress steps for better user feedback during generation
const PROGRESS_STEPS = [
  { message: 'Preparing your image', duration: 1500 },
  { message: 'Uploading to cloud storage', duration: 3000 },
  { message: 'Analyzing image content', duration: 8000 },
  { message: 'Generating creative captions', duration: 15000 },
  { message: 'Almost there', duration: 30000 },
] as const;

/**
 * Normalizes image orientation by reading EXIF data and rotating via canvas.
 * This fixes sideways/upside-down photos from mobile devices.
 */
async function normalizeImageOrientation(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Create canvas and draw the image - browser handles EXIF orientation
      // when using image-orientation: from-image CSS, but we also normalize
      // the actual file data for consistent server-side handling
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file);
        return;
      }

      // Set canvas size to image dimensions
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Draw image (browser auto-applies EXIF orientation in modern browsers)
      ctx.drawImage(img, 0, 0);

      // Convert back to blob/file
      canvas.toBlob((blob) => {
        if (blob) {
          const normalizedFile = new File([blob], file.name, {
            type: file.type || 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(normalizedFile);
        } else {
          resolve(file);
        }
      }, file.type || 'image/jpeg', 0.92);
    };

    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

// Image component with loading and error states
function ResultImage({ src, alt }: { src: string; alt: string }) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');

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

export function GenerateTab({ onViewGallery, onCaptionsGenerated }: GenerateTabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate progress steps to give users feedback during long generation
  const startProgressAnimation = useCallback(() => {
    setProgressStep(0);
    let step = 0;

    const advanceStep = () => {
      if (step < PROGRESS_STEPS.length - 1) {
        step++;
        setProgressStep(step);
        setProgress(PROGRESS_STEPS[step].message);
        progressTimerRef.current = setTimeout(advanceStep, PROGRESS_STEPS[step].duration);
      }
    };

    setProgress(PROGRESS_STEPS[0].message);
    progressTimerRef.current = setTimeout(advanceStep, PROGRESS_STEPS[0].duration);
  }, []);

  const stopProgressAnimation = useCallback(() => {
    if (progressTimerRef.current) {
      clearTimeout(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setError(null);
      setResult(null);

      // Show loading state while normalizing
      setFile(selectedFile);

      // Create preview using canvas to handle EXIF orientation
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
          setPreview(canvas.toDataURL('image/jpeg', 0.9));
        } else {
          // Fallback to direct data URL
          const reader = new FileReader();
          reader.onload = (ev) => setPreview(ev.target?.result as string);
          reader.readAsDataURL(selectedFile);
        }
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        // Fallback
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result as string);
        reader.readAsDataURL(selectedFile);
      };
      img.src = URL.createObjectURL(selectedFile);
    }
  }

  function clearSelection() {
    setFile(null);
    setPreview(null);
    setError(null);
    setResult(null);
    setProgress('');
    setProgressStep(0);
    stopProgressAnimation();
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
    startProgressAnimation();

    try {
      // Normalize image orientation before upload
      const normalizedFile = await normalizeImageOrientation(file);

      const formData = new FormData();
      formData.append('file', normalizedFile);

      const response = await fetch('/api/pipeline/generate-captions', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate captions');
      }

      stopProgressAnimation();
      setProgress('');
      setResult(data);

      // Notify parent about new captions for gallery highlighting
      if (onCaptionsGenerated && data.imageId) {
        onCaptionsGenerated(data.imageId);
      }
    } catch (err) {
      stopProgressAnimation();
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
              <li key={index} className="caption-card">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded text-xs font-semibold flex items-center justify-center" style={{ background: 'var(--accent-muted)', color: 'var(--accent-primary)' }}>
                    {index + 1}
                  </span>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      );
    }

    // Fallback: render as JSON
    return (
      <pre className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs overflow-auto text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
        {JSON.stringify(captions, null, 2)}
      </pre>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card-elevated rounded-2xl p-5 sm:p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-muted)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
              <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-1">
            Generate Captions
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload an image and let AI create captions
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Upload zone */}
          {!preview ? (
            <div className="mb-5">
              <label className="block">
                <div className="upload-zone rounded-xl p-6 text-center cursor-pointer transition-all">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-muted)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-0.5">
                    Click to upload
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
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
            <div className="mb-5">
              <div className="relative aspect-video image-container rounded-xl overflow-hidden">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={isUploading}
                  className="absolute top-2 right-2 w-7 h-7 rounded-md bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Submit button - disabled during upload to prevent duplicates */}
          <button
            type="submit"
            disabled={!file || isUploading}
            className="btn-primary w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner-white"></div>
                Generating...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1"/>
                </svg>
                Generate Captions
              </span>
            )}
          </button>
        </form>

        {/* Progress - enhanced with timing info and animated feedback */}
        {progress && (
          <div className="mt-5 p-4 rounded-xl loading-glow" style={{ background: 'var(--accent-muted)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="spinner-lg"></div>
              <div>
                <p className="text-sm font-medium loading-dots" style={{ color: 'var(--accent-primary)' }}>
                  {progress}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  This may take up to a minute
                </p>
              </div>
            </div>
            {/* Progress indicator dots */}
            <div className="flex gap-1.5 mt-3">
              {PROGRESS_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: idx <= progressStep ? '24px' : '8px',
                    background: idx <= progressStep
                      ? 'var(--accent-primary)'
                      : 'rgba(148, 163, 184, 0.3)'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
            <div className="flex items-start gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                Generated Captions
              </h3>
            </div>

            {/* Show uploaded image */}
            <div className="mb-4 aspect-video image-container rounded-xl overflow-hidden relative">
              <ResultImage src={result.cdnUrl} alt="Uploaded image" />
            </div>

            {/* Captions */}
            <div className="mb-5">
              {renderCaptions(result.captions)}
            </div>

            {/* View in Gallery button */}
            <button
              type="button"
              onClick={onViewGallery}
              className="btn-secondary w-full text-sm"
            >
              <span className="flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
