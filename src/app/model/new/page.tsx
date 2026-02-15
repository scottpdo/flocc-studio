'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useModelStore } from '@/stores/model';

export default function NewModelPage() {
  const router = useRouter();
  const newModel = useModelStore((s) => s.newModel);
  const model = useModelStore((s) => s.model);

  useEffect(() => {
    // Create a new model and redirect to editor
    newModel();
  }, [newModel]);

  useEffect(() => {
    // Once model is created, redirect to its edit page
    if (model) {
      router.replace(`/model/${model.id}/edit`);
    }
  }, [model, router]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white text-lg">Creating new model...</div>
    </div>
  );
}
