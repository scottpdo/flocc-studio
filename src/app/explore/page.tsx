'use client';

/**
 * Explore Page
 *
 * Browsable gallery of public models with search and pagination.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { listModels } from '@/lib/api/models';
import { ModelCard } from '@/components/models/ModelCard';
import { AuthButtons } from '@/components/auth/AuthButtons';
import type { StudioModel } from '@/types';

const PAGE_SIZE = 12;

// ─── Inner component (needs useSearchParams) ───────────────────────────────

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get('q') ?? '';
  const initialPage = Math.max(1, Number(searchParams.get('page') ?? '1'));

  const [models, setModels] = useState<StudioModel[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [inputValue, setInputValue] = useState(initialSearch);
  const [loading, setLoading] = useState(true);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Fetch models when page or search changes
  const fetchModels = useCallback(async (q: string, p: number) => {
    setLoading(true);
    const result = await listModels({ search: q || undefined, page: p, limit: PAGE_SIZE });
    setModels(result.models);
    setTotal(result.total);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchModels(search, page);
  }, [search, page, fetchModels]);

  // Sync URL when search/page change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.replace(qs ? `/explore?${qs}` : '/explore', { scroll: false });
  }, [search, page, router]);

  // Debounced search input
  const handleSearchInput = (value: string) => {
    setInputValue(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
  };

  const handlePage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Search bar */}
      <div className="flex gap-3 mb-8">
        <input
          type="search"
          value={inputValue}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="Search models…"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">
        {loading ? 'Loading…' : `${total} model${total !== 1 ? 's' : ''}${search ? ` for "${search}"` : ''}`}
      </p>

      {/* Grid */}
      {!loading && models.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">No models found</p>
          <Link
            href="/model/new"
            className="text-blue-400 hover:underline"
          >
            Create one →
          </Link>
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-150 ${loading ? 'opacity-40 pointer-events-none' : ''}`}>
          {(loading ? Array(PAGE_SIZE).fill(null) : models).map((model, i) =>
            model ? (
              <ModelCard key={model.id} model={model} />
            ) : (
              // Skeleton card while loading
              <div key={i} className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-800" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => handlePage(page - 1)}
            disabled={page <= 1 || loading}
            className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition"
          >
            ← Prev
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | '…')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
              acc.push(p);
              return acc;
            }, [])
            .map((item, i) =>
              item === '…' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-gray-600">…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => handlePage(item as number)}
                  disabled={loading}
                  className={`w-9 h-9 rounded text-sm transition ${
                    item === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  } disabled:cursor-not-allowed`}
                >
                  {item}
                </button>
              )
            )}

          <button
            onClick={() => handlePage(page + 1)}
            disabled={page >= totalPages || loading}
            className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition"
          >
            Next →
          </button>
        </div>
      )}
    </>
  );
}

// ─── Page shell (static-safe) ───────────────────────────────────────────────

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Flocc Studio
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/explore" className="text-white font-medium">
              Explore
            </Link>
            <Link
              href="/model/new"
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition"
            >
              Create Model
            </Link>
            <AuthButtons />
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Explore Models</h1>
        <Suspense fallback={<div className="text-gray-500">Loading…</div>}>
          <ExploreContent />
        </Suspense>
      </main>
    </div>
  );
}
