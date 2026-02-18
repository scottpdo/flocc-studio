'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useModelStore } from '@/stores/model';
import { loadModel } from '@/lib/api/models';
import { EditorLayout } from '@/components/editor/EditorLayout';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ModelEditPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  
  const model = useModelStore((s) => s.model);
  const setModel = useModelStore((s) => s.setModel);
  const newModel = useModelStore((s) => s.newModel);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // If editing an existing model, load it from the database
      if (id !== 'new') {
        setLoading(true);
        const loadedModel = await loadModel(id);
        
        if (loadedModel) {
          setModel(loadedModel);
        } else {
          setError('Model not found');
        }
        setLoading(false);
      } else {
        // Create a new model
        if (!model) {
          newModel();
        }
        setLoading(false);
      }
    }

    load();
  }, [id, model, newModel, setModel]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-white"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return <EditorLayout modelId={id} />;
}
