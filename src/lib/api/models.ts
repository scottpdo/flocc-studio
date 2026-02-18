/**
 * Models API Client
 */

import type { StudioModel } from '@/types';

export interface SaveModelResult {
  success: boolean;
  model?: StudioModel;
  error?: string;
}

/**
 * Save a model (create or update)
 */
export async function saveModel(model: StudioModel, isNew: boolean): Promise<SaveModelResult> {
  try {
    const url = isNew ? '/api/models' : `/api/models/${model.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(model),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: data.error ?? `Failed to save (${response.status})` 
      };
    }

    const savedModel = await response.json();
    return { success: true, model: savedModel };
  } catch (error) {
    console.error('Failed to save model:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Load a model by ID
 */
export async function loadModel(id: string): Promise<StudioModel | null> {
  try {
    const response = await fetch(`/api/models/${id}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to load model:', error);
    return null;
  }
}

/**
 * Delete a model
 */
export async function deleteModel(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/models/${id}`, { method: 'DELETE' });
    return response.ok;
  } catch (error) {
    console.error('Failed to delete model:', error);
    return false;
  }
}

/**
 * List models
 */
export async function listModels(params?: {
  page?: number;
  limit?: number;
  userId?: string;
  featured?: boolean;
  search?: string;
}): Promise<{ models: StudioModel[]; total: number }> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.featured) searchParams.set('featured', 'true');
    if (params?.search) searchParams.set('search', params.search);

    const response = await fetch(`/api/models?${searchParams}`);
    if (!response.ok) return { models: [], total: 0 };
    
    const data = await response.json();
    return { models: data.models, total: data.total };
  } catch (error) {
    console.error('Failed to list models:', error);
    return { models: [], total: 0 };
  }
}
