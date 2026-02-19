'use client';

/**
 * VisualizationPanel
 * 
 * Subpanel for editing a visualization's configuration.
 * Allows editing name, series, and chart options.
 */

import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useModelStore } from '@/stores/model';
import { useSimulationStore } from '@/stores/simulation';
import type { Visualization, ChartSeries, MetricConfig, PropertyMetric } from '@/types';

interface VisualizationPanelProps {
  visualizationId: string;
  onClose: () => void;
}

const AGGREGATIONS = [
  { value: 'mean', label: 'Mean' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
  { value: 'sum', label: 'Sum' },
  { value: 'median', label: 'Median' },
];

export function VisualizationPanel({ visualizationId, onClose }: VisualizationPanelProps) {
  const model = useModelStore((s) => s.model);
  const updateVisualization = useModelStore((s) => s.updateVisualization);
  const addSeries = useModelStore((s) => s.addSeries);
  const updateSeries = useModelStore((s) => s.updateSeries);
  const removeSeries = useModelStore((s) => s.removeSeries);
  
  const engine = useSimulationStore((s) => s.engine);
  const chartCanvas = engine?.getChartCanvas(visualizationId);

  if (!model) {
    return null;
  }

  const visualization = model.visualizations?.find((v) => v.id === visualizationId);
  const agentTypes = model.agentTypes;

  if (!visualization) {
    return (
      <div className="p-4 text-gray-500">
        Visualization not found
      </div>
    );
  }

  const handleNameChange = (name: string) => {
    updateVisualization(visualizationId, { name });
  };

  const handleEnabledChange = (enabled: boolean) => {
    updateVisualization(visualizationId, { enabled });
  };

  const handleOptionsChange = (options: Partial<Visualization['options']>) => {
    updateVisualization(visualizationId, {
      options: { ...visualization.options, ...options },
    });
  };

  const handleAddSeries = () => {
    const firstAgentType = agentTypes[0];
    if (!firstAgentType) return;

    const newSeries: ChartSeries = {
      id: nanoid(),
      name: `Series ${visualization.series.length + 1}`,
      color: getNextColor(visualization.series.length),
      metric: {
        type: 'count',
        agentTypeId: firstAgentType.id,
      },
    };

    addSeries(visualizationId, newSeries);
  };

  const handleRemoveSeries = (seriesId: string) => {
    removeSeries(visualizationId, seriesId);
  };

  const handleSeriesChange = (seriesId: string, changes: Partial<ChartSeries>) => {
    updateSeries(visualizationId, seriesId, changes);
  };

  const handleMetricChange = (seriesId: string, metric: MetricConfig) => {
    updateSeries(visualizationId, seriesId, { metric });
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="font-medium">Edit Visualization</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Chart Preview */}
        {chartCanvas && (
          <div className="border border-gray-700 rounded overflow-hidden">
            <canvas
              ref={(el) => {
                if (el && chartCanvas && el !== chartCanvas) {
                  // Copy canvas content for preview
                  const ctx = el.getContext('2d');
                  if (ctx) {
                    el.width = chartCanvas.width;
                    el.height = chartCanvas.height;
                    el.style.width = '100%';
                    el.style.height = 'auto';
                    ctx.drawImage(chartCanvas, 0, 0);
                  }
                }
              }}
              className="w-full"
            />
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Name</label>
          <input
            type="text"
            value={visualization.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
          />
        </div>

        {/* Enabled */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="viz-enabled"
            checked={visualization.enabled}
            onChange={(e) => handleEnabledChange(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="viz-enabled" className="text-sm">Enabled</label>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Chart Options</h4>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto-scale"
              checked={visualization.options.autoScale}
              onChange={(e) => handleOptionsChange({ autoScale: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="auto-scale" className="text-sm">Auto-scale Y axis</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto-scroll"
              checked={visualization.options.autoScroll}
              onChange={(e) => handleOptionsChange({ autoScroll: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="auto-scroll" className="text-sm">Auto-scroll X axis</label>
          </div>

          {!visualization.options.autoScale && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Y Min</label>
                <input
                  type="number"
                  value={visualization.options.range?.min ?? 0}
                  onChange={(e) => handleOptionsChange({
                    range: {
                      min: Number(e.target.value),
                      max: visualization.options.range?.max ?? 100,
                    },
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Y Max</label>
                <input
                  type="number"
                  value={visualization.options.range?.max ?? 100}
                  onChange={(e) => handleOptionsChange({
                    range: {
                      min: visualization.options.range?.min ?? 0,
                      max: Number(e.target.value),
                    },
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Series */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-300">Data Series</h4>
            <button
              onClick={handleAddSeries}
              className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
            >
              + Add Series
            </button>
          </div>

          {visualization.series.length === 0 ? (
            <p className="text-sm text-gray-500">No series added</p>
          ) : (
            <div className="space-y-3">
              {visualization.series.map((series) => (
                <SeriesEditor
                  key={series.id}
                  series={series}
                  agentTypes={agentTypes}
                  onChange={(changes) => handleSeriesChange(series.id, changes)}
                  onMetricChange={(metric) => handleMetricChange(series.id, metric)}
                  onRemove={() => handleRemoveSeries(series.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Series Editor Component
// ============================================================================

interface SeriesEditorProps {
  series: ChartSeries;
  agentTypes: Array<{ id: string; name: string; properties: Array<{ name: string }> }>;
  onChange: (changes: Partial<ChartSeries>) => void;
  onMetricChange: (metric: MetricConfig) => void;
  onRemove: () => void;
}

function SeriesEditor({ series, agentTypes, onChange, onMetricChange, onRemove }: SeriesEditorProps) {
  const selectedAgentType = agentTypes.find((at) => at.id === series.metric.agentTypeId);
  const properties = selectedAgentType?.properties ?? [];

  const handleMetricTypeChange = (type: 'count' | 'property') => {
    if (type === 'count') {
      onMetricChange({
        type: 'count',
        agentTypeId: series.metric.agentTypeId,
      });
    } else {
      onMetricChange({
        type: 'property',
        agentTypeId: series.metric.agentTypeId,
        property: properties[0]?.name ?? '',
        aggregation: 'mean',
      });
    }
  };

  const handleAgentTypeChange = (agentTypeId: string) => {
    const newAgentType = agentTypes.find((at) => at.id === agentTypeId);
    if (series.metric.type === 'count') {
      onMetricChange({ type: 'count', agentTypeId });
    } else {
      onMetricChange({
        type: 'property',
        agentTypeId,
        property: newAgentType?.properties[0]?.name ?? '',
        aggregation: series.metric.aggregation,
      });
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded p-3 space-y-2">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={series.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="bg-transparent border-b border-gray-600 px-1 py-0.5 text-sm font-medium focus:border-blue-500 outline-none"
        />
        <button
          onClick={onRemove}
          className="text-gray-500 hover:text-red-400 text-xs"
        >
          Remove
        </button>
      </div>

      {/* Color */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 w-16">Color</label>
        <input
          type="color"
          value={series.color}
          onChange={(e) => onChange({ color: e.target.value })}
          className="w-8 h-6 rounded cursor-pointer"
        />
        <span className="text-xs text-gray-500">{series.color}</span>
      </div>

      {/* Metric Type */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 w-16">Metric</label>
        <select
          value={series.metric.type}
          onChange={(e) => handleMetricTypeChange(e.target.value as 'count' | 'property')}
          className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
        >
          <option value="count">Agent Count</option>
          <option value="property">Property Value</option>
        </select>
      </div>

      {/* Agent Type */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 w-16">Agent</label>
        <select
          value={series.metric.agentTypeId}
          onChange={(e) => handleAgentTypeChange(e.target.value)}
          className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
        >
          {agentTypes.map((at) => (
            <option key={at.id} value={at.id}>{at.name}</option>
          ))}
        </select>
      </div>

      {/* Property-specific options */}
      {series.metric.type === 'property' && (() => {
        const propMetric = series.metric as PropertyMetric;
        return (
          <>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 w-16">Property</label>
              <select
                value={propMetric.property}
                onChange={(e) => onMetricChange({
                  type: 'property',
                  agentTypeId: propMetric.agentTypeId,
                  property: e.target.value,
                  aggregation: propMetric.aggregation,
                })}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
              >
                {properties.length === 0 ? (
                  <option value="">No properties</option>
                ) : (
                  properties.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))
                )}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 w-16">Aggregate</label>
              <select
                value={propMetric.aggregation}
                onChange={(e) => onMetricChange({
                  type: 'property',
                  agentTypeId: propMetric.agentTypeId,
                  property: propMetric.property,
                  aggregation: e.target.value as 'mean' | 'min' | 'max' | 'sum' | 'median',
                })}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
              >
                {AGGREGATIONS.map((agg) => (
                  <option key={agg.value} value={agg.value}>{agg.label}</option>
                ))}
              </select>
            </div>
          </>
        );
      })()}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

const CHART_COLORS = [
  '#22c55e', // green
  '#ef4444', // red
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

function getNextColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
