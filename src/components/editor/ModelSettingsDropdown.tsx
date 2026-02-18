'use client';

/**
 * ModelSettingsDropdown
 *
 * Gear icon that opens a dropdown of top-level model settings.
 * Currently: Make Public toggle.
 * Future: tags, license, collaborators, etc.
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { useModelStore } from '@/stores/model';

interface Props {
  modelId: string;
  /** Disable when the model has never been saved to the database */
  disabled?: boolean;
}

export function ModelSettingsDropdown({ modelId, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const isPublic = useModelStore((s) => s.model?.isPublic ?? false);
  const setIsPublic = useModelStore((s) => s.setIsPublic);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open]);

  const handleTogglePublic = useCallback(async (next: boolean) => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/models/${modelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: next }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Failed to update');
      } else {
        setIsPublic(next);
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }, [modelId, setIsPublic]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Gear button */}
      <button
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        title={disabled ? 'Save the model first' : 'Model settings'}
        className={`p-2 rounded transition ${
          disabled
            ? 'opacity-30 cursor-not-allowed'
            : open
            ? 'bg-gray-700 text-white'
            : 'hover:bg-gray-800 text-gray-400 hover:text-white'
        }`}
      >
        {/* Gear SVG */}
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
          {/* Section header */}
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">
            Visibility
          </div>

          {/* Make Public */}
          <label className="flex items-start gap-3 px-3 py-3 hover:bg-gray-800 cursor-pointer transition select-none">
            <input
              type="checkbox"
              checked={isPublic}
              disabled={saving}
              onChange={(e) => handleTogglePublic(e.target.checked)}
              className="mt-0.5 accent-blue-500 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Make Public</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {isPublic
                  ? 'Visible on Explore. Uncheck to make private.'
                  : 'Only you can see this model.'}
              </div>
            </div>
            {saving && (
              <svg className="w-4 h-4 text-gray-500 animate-spin shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
          </label>

          {/* Inline error */}
          {error && (
            <div className="px-3 py-2 text-xs text-red-400 border-t border-gray-800">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
