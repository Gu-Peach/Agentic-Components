import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import type {
  CatalogCategory,
  CatalogDevice,
  PublicCatalogResponse,
} from '@/types/catalog';
import type { DeviceType } from '@/types/scene';

type StorageItem = {
  id?: string | null;
  name: string;
  updated_at?: string | null;
  metadata?: {
    mimetype?: string;
  } | null;
};

const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'modles';
const COMPONENTS_PREFIX =
  process.env.NEXT_PUBLIC_SUPABASE_COMPONENTS_PREFIX ?? 'Components';
const LAYOUTS_PREFIX =
  process.env.NEXT_PUBLIC_SUPABASE_LAYOUTS_PREFIX ?? 'Layouts';

function stripExtension(name: string): string {
  return name.replace(/\.[^/.]+$/, '');
}

function prettifyName(name: string): string {
  return stripExtension(name).replace(/[_-]+/g, ' ').trim() || '未命名模型';
}

function normalizeDeviceType(name: string): DeviceType {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('conveyor')) {
    return 'conveyor';
  }
  if (lowerName.includes('lift')) {
    return 'lift';
  }
  if (lowerName.includes('storage')) {
    return 'storage';
  }
  return 'robot';
}

function isPlaceholder(item: StorageItem): boolean {
  return item.name === '.emptyFolderPlaceholder';
}

function isFolder(item: StorageItem): boolean {
  return !item.id;
}

function isModelFile(item: StorageItem): boolean {
  if (!item.id || isPlaceholder(item)) {
    return false;
  }

  const lowerName = item.name.toLowerCase();
  return lowerName.endsWith('.glb') || lowerName.endsWith('.gltf') || lowerName.endsWith('.json');
}

async function listObjects(prefix: string): Promise<StorageItem[]> {
  const client = getSupabaseAdminClient();
  const { data, error } = await client.storage.from(STORAGE_BUCKET).list(prefix, {
    limit: 200,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StorageItem[];
}

function getPublicModelUrl(objectPath: string): string {
  const client = getSupabaseAdminClient();
  const {
    data: { publicUrl },
  } = client.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
  return publicUrl;
}

function toLayoutDevice(item: StorageItem): CatalogDevice {
  const objectPath = `${LAYOUTS_PREFIX}/${item.name}`;
  return {
    id: `layout:${item.id ?? item.name}`,
    name: prettifyName(item.name),
    deviceType: normalizeDeviceType(item.name),
    kind: 'layout',
    section: 'layouts',
    objectPath,
    modelUrl: getPublicModelUrl(objectPath),
    updatedAt: item.updated_at ?? undefined,
  };
}

function toComponentDevice(category: string, item: StorageItem): CatalogDevice {
  const objectPath = `${COMPONENTS_PREFIX}/${category}/${item.name}`;
  return {
    id: `component:${category}:${item.id ?? item.name}`,
    name: prettifyName(item.name),
    deviceType: normalizeDeviceType(`${category} ${item.name}`),
    kind: 'component',
    section: 'components',
    category,
    objectPath,
    modelUrl: getPublicModelUrl(objectPath),
    updatedAt: item.updated_at ?? undefined,
  };
}

async function loadLayoutDevices(): Promise<CatalogDevice[]> {
  const items = await listObjects(LAYOUTS_PREFIX);
  return items.filter(isModelFile).map(toLayoutDevice);
}

async function loadComponentDevices(): Promise<{
  devices: CatalogDevice[];
  categories: CatalogCategory[];
}> {
  const rootItems = await listObjects(COMPONENTS_PREFIX);
  const folders = rootItems.filter((item) => isFolder(item) && !isPlaceholder(item));

  const categoryResults = await Promise.all(
    folders.map(async (folder) => {
      const items = await listObjects(`${COMPONENTS_PREFIX}/${folder.name}`);
      const devices = items
        .filter(isModelFile)
        .map((item) => toComponentDevice(folder.name, item));

      const category: CatalogCategory = {
        id: `components:${folder.name}`,
        label: folder.name,
        section: 'components',
        itemCount: devices.length,
      };

      return { category, devices };
    }),
  );

  return {
    categories: categoryResults.map((result) => result.category),
    devices: categoryResults.flatMap((result) => result.devices),
  };
}

export async function GET() {
  try {
    const [layoutDevices, componentData] = await Promise.all([
      loadLayoutDevices(),
      loadComponentDevices(),
    ]);

    const response: PublicCatalogResponse = {
      devices: [...componentData.devices, ...layoutDevices],
      categories: [
        ...componentData.categories,
        {
          id: 'layouts:root',
          label: 'Layouts',
          section: 'layouts',
          itemCount: layoutDevices.length,
        },
      ],
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '模型目录加载失败';
    return new NextResponse(message, { status: 500 });
  }
}
