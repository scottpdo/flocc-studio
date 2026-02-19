'use client';

/**
 * /model/new — Template Picker
 *
 * Shows available starter templates. On selection, loads the template
 * into the model store and navigates to the editor.
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useModelStore } from '@/stores/model';
import { AuthButtons } from '@/components/auth/AuthButtons';
import { TEMPLATES, type TemplateInfo } from '@/lib/templates';

export default function NewModelPage() {
  const router = useRouter();
  const setModel = useModelStore((s) => s.setModel);

  const handleSelect = useCallback(
    (template: TemplateInfo) => {
      const model = template.create();
      setModel(model);
      router.push('/model/new/edit');
    },
    [setModel, router]
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 shrink-0">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Flocc Studio
          </Link>
          <AuthButtons />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">New Model</h1>
        <p className="text-gray-400 mb-12">
          Start from a template or build from scratch.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
          {TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={() => handleSelect(template)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

// ─── TemplateCard ─────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: TemplateInfo;
  onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <button
      onClick={onSelect}
      className="group text-left bg-gray-900 border border-gray-800 rounded-xl p-6
                 hover:border-blue-500 hover:bg-gray-800 transition-all duration-150
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {/* Icon */}
      <div className="text-5xl mb-4">{template.icon}</div>

      {/* Name */}
      <h2 className="text-lg font-semibold mb-1 group-hover:text-blue-400 transition-colors">
        {template.name}
      </h2>

      {/* Description */}
      <p className="text-sm text-gray-400 leading-relaxed">
        {template.description}
      </p>

      {/* Tags */}
      {template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-4">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
