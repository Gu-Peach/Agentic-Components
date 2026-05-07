import { access, readdir, stat } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { basename, join, posix } from 'node:path';
import type {
  CatalogCategory,
  CatalogDevice,
  PublicCatalogResponse,
} from '@/types/catalog';
import type { DeviceType } from '@/types/scene';

const PUBLIC_ROOT_CANDIDATES = ['public', 'frontend/public'];
const MODEL_ROOT_CANDIDATES = ['modles', 'models'];
const COMPONENTS_DIR_CANDIDATES = ['Components', 'assets'];
const LAYOUTS_DIR_CANDIDATES = ['Layouts', 'scene'];
const MODEL_FILE_EXTENSIONS = ['.glb', '.gltf', '.json'];

type ResolvedCatalogPaths = {
  modelRootPath: string;
  modelRootUrl: string;
  componentsDirName: string;
  layoutsDirName: string;
};

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

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveFirstExistingPath(candidates: string[]): Promise<string> {
  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  throw new Error(`未找到可用目录：${candidates.join(', ')}`);
}

async function resolveCatalogPaths(): Promise<ResolvedCatalogPaths> {
  const publicRoot = await resolveFirstExistingPath(
    PUBLIC_ROOT_CANDIDATES.map((candidate) => join(process.cwd(), candidate)),
  );
  const modelRootPath = await resolveFirstExistingPath(
    MODEL_ROOT_CANDIDATES.map((candidate) => join(publicRoot, candidate)),
  );
  const componentsDirPath = await resolveFirstExistingPath(
    COMPONENTS_DIR_CANDIDATES.map((candidate) => join(modelRootPath, candidate)),
  );
  const layoutsDirPath = await resolveFirstExistingPath(
    LAYOUTS_DIR_CANDIDATES.map((candidate) => join(modelRootPath, candidate)),
  );

  return {
    modelRootPath,
    modelRootUrl: `/${basename(modelRootPath)}`,
    componentsDirName: basename(componentsDirPath),
    layoutsDirName: basename(layoutsDirPath),
  };
}

function isModelFile(name: string): boolean {
  const lowerName = name.toLowerCase();
  return MODEL_FILE_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

async function readModelFiles(directoryPath: string): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && isModelFile(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function readSubdirectories(directoryPath: string): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function getUpdatedAt(path: string): Promise<string | undefined> {
  try {
    const fileStat = await stat(path);
    return fileStat.mtime.toISOString();
  } catch {
    return undefined;
  }
}

async function toLayoutDevice(
  root: ResolvedCatalogPaths,
  fileName: string,
): Promise<CatalogDevice> {
  const objectPath = posix.join(root.modelRootUrl, root.layoutsDirName, fileName);
  const absolutePath = join(root.modelRootPath, root.layoutsDirName, fileName);

  return {
    id: `layout:${fileName}`,
    name: prettifyName(fileName),
    deviceType: normalizeDeviceType(fileName),
    kind: 'layout',
    section: 'layouts',
    objectPath,
    modelUrl: objectPath,
    updatedAt: await getUpdatedAt(absolutePath),
  };
}

async function toComponentDevice(
  root: ResolvedCatalogPaths,
  category: string,
  fileName: string,
): Promise<CatalogDevice> {
  const objectPath = posix.join(root.modelRootUrl, root.componentsDirName, category, fileName);
  const absolutePath = join(root.modelRootPath, root.componentsDirName, category, fileName);

  return {
    id: `component:${category}:${fileName}`,
    name: prettifyName(fileName),
    deviceType: normalizeDeviceType(`${category} ${fileName}`),
    kind: 'component',
    section: 'components',
    category,
    objectPath,
    modelUrl: objectPath,
    updatedAt: await getUpdatedAt(absolutePath),
  };
}

export async function loadLocalPublicCatalog(): Promise<PublicCatalogResponse> {
  const root = await resolveCatalogPaths();
  const layoutsDirPath = join(root.modelRootPath, root.layoutsDirName);
  const componentsDirPath = join(root.modelRootPath, root.componentsDirName);
  const [layoutFiles, componentCategories] = await Promise.all([
    readModelFiles(layoutsDirPath),
    readSubdirectories(componentsDirPath),
  ]);

  const layoutDevices = await Promise.all(
    layoutFiles.map((fileName) => toLayoutDevice(root, fileName)),
  );
  const componentResults = await Promise.all(
    componentCategories.map(async (category) => {
      const categoryPath = join(componentsDirPath, category);
      const fileNames = await readModelFiles(categoryPath);
      const devices = await Promise.all(
        fileNames.map((fileName) => toComponentDevice(root, category, fileName)),
      );

      const categoryMeta: CatalogCategory = {
        id: `components:${category}`,
        label: category,
        section: 'components',
        itemCount: devices.length,
      };

      return { categoryMeta, devices };
    }),
  );

  return {
    devices: [...componentResults.flatMap((result) => result.devices), ...layoutDevices],
    categories: [
      ...componentResults.map((result) => result.categoryMeta),
      {
        id: 'layouts:root',
        label: 'Layouts',
        section: 'layouts',
        itemCount: layoutDevices.length,
      },
    ],
  };
}
