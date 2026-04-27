import type { DeviceType } from '@/types/scene';

export type CatalogCollection = {
  id: string;
  label: string;
};

export type CatalogSection = 'all' | 'components' | 'layouts';

export type CatalogItemKind = 'component' | 'layout';

export type CatalogDevice = {
  id: string;
  name: string;
  deviceType: DeviceType;
  kind: CatalogItemKind;
  section: Exclude<CatalogSection, 'all'>;
  category?: string;
  objectPath: string;
  modelUrl: string;
  updatedAt?: string;
};

export type CatalogCategory = {
  id: string;
  label: string;
  section: Exclude<CatalogSection, 'all'>;
  itemCount: number;
};

export type PublicCatalogResponse = {
  devices: CatalogDevice[];
  categories: CatalogCategory[];
};
