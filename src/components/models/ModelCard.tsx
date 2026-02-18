'use client';

/**
 * ModelCard
 *
 * Shared preview card used in Explore and Dashboard.
 * When showActions is true (dashboard) the Edit / Delete buttons are visible.
 */

import Link from 'next/link';
import type { StudioModel } from '@/types';

interface ModelCardProps {
  model: StudioModel;
  /** Show owner-only actions (Edit / Delete) */
  showActions?: boolean;
  onDelete?: (id: string, name: string) => void;
  isDeleting?: boolean;
}

export function ModelCard({ model, showActions = false, onDelete, isDeleting }: ModelCardProps) {
  const agentCount = model.agentTypes?.length ?? 0;
  const updatedAt = model.updatedAt
    ? new Date(model.updatedAt).toLocaleDateString()
    : null;

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <Link href={`/model/${model.id}`} className="block">
        <div className="aspect-video bg-gray-800 flex items-center justify-center overflow-hidden">
          {model.thumbnailUrl ? (
            <img
              src={model.thumbnailUrl}
              alt={model.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm text-gray-600">No preview</span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/model/${model.id}`} className="block mb-1">
          <h3 className="font-semibold hover:text-blue-400 transition line-clamp-1">
            {model.name}
          </h3>
        </Link>

        {model.description && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-2">
            {model.description}
          </p>
        )}

        <div className="text-xs text-gray-600 mt-auto">
          {agentCount} agent type{agentCount !== 1 ? 's' : ''}
          {updatedAt && <> · {updatedAt}</>}
        </div>

        {/* Owner actions */}
        {showActions && (
          <div className="flex gap-2 mt-3">
            <Link
              href={`/model/${model.id}/edit`}
              className="flex-1 text-center px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm transition"
            >
              Edit
            </Link>
            <Link
              href={`/model/${model.id}`}
              className="flex-1 text-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm transition"
            >
              View
            </Link>
            {onDelete && (
              <button
                onClick={() => onDelete(model.id, model.name)}
                disabled={isDeleting}
                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-sm transition disabled:opacity-50"
                title="Delete"
              >
                {isDeleting ? '…' : '×'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
