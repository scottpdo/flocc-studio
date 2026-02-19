'use client';

/**
 * Accordion
 * 
 * A collapsible section with a header and expandable content.
 */

import { useState, useCallback, ReactNode } from 'react';

interface AccordionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  /** Optional action button in the header */
  action?: ReactNode;
  /** Badge/count to show next to title */
  badge?: number;
}

export function Accordion({ 
  title, 
  defaultOpen = false, 
  children, 
  action,
  badge 
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = useCallback(() => setIsOpen((o) => !o), []);

  return (
    <div className="border-b border-gray-800">
      {/* Header */}
      <button
        onClick={toggle}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-800/50 transition text-left"
      >
        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-90' : ''
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M6 4l8 6-8 6V4z" />
        </svg>

        {/* Title */}
        <span className="font-medium text-sm flex-1">{title}</span>

        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}

        {/* Action button (stop propagation so clicking it doesn't toggle) */}
        {action && (
          <div onClick={(e) => e.stopPropagation()}>
            {action}
          </div>
        )}
      </button>

      {/* Content */}
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}
