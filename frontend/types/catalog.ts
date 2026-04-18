import type { DeviceType } from '@/types/scene';

export type CatalogCollection = {
  id: string;
  label: string;
};

export type CatalogDevice = {
  id: string;
  name: string;
  deviceType: DeviceType;
};
