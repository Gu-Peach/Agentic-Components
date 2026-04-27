'use client';

import type { PublicCatalogResponse } from '@/types/catalog';

export async function fetchPublicCatalog(): Promise<PublicCatalogResponse> {
  const response = await fetch('/api/catalog/public-models', {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || '模型目录加载失败');
  }

  return (await response.json()) as PublicCatalogResponse;
}
