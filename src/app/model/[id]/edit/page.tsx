'use client';

import { useEffect, use } from 'react';
import Link from 'next/link';
import { useModelStore } from '@/stores/model';
import { useSimulationStore } from '@/stores/simulation';
import { EditorLayout } from '@/components/editor/EditorLayout';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ModelEditPage({ params }: Props) {
  const { id } = use(params);
  const model = useModelStore((s) => s.model);
  const setModel = useModelStore((s) => s.setModel);
  const newModel = useModelStore((s) => s.newModel);
  const isDirty = useModelStore((s) => s.isDirty);

  useEffect(() => {
    // TODO: If id is not 'new', fetch model from database
    // For now, create a new model if none exists
    if (!model) {
      newModel();
    }
  }, [model, newModel]);

  if (!model) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return <EditorLayout modelId={id} />;
}
