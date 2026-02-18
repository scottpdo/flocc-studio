'use client';

/**
 * Dashboard — User's saved models
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { listModels, deleteModel } from '@/lib/api/models';
import { ModelCard } from '@/components/models/ModelCard';
import { AuthButtons } from '@/components/auth/AuthButtons';
import type { StudioModel } from '@/types';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [models, setModels] = useState<StudioModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard');
      return;
    }

    if (session?.user?.id) {
      loadModels();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  async function loadModels() {
    setLoading(true);
    const result = await listModels({ userId: session?.user?.id });
    setModels(result.models);
    setLoading(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    
    setDeletingId(id);
    const success = await deleteModel(id);
    setDeletingId(null);
    
    if (success) {
      setModels((prev) => prev.filter((m) => m.id !== id));
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Flocc Studio
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/explore" className="text-gray-300 hover:text-white transition">
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

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Models</h1>

        {models.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-6">You haven't created any models yet.</p>
            <Link
              href="/model/new"
              className="inline-block bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-medium transition"
            >
              Create Your First Model
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                showActions
                onDelete={handleDelete}
                isDeleting={deletingId === model.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
