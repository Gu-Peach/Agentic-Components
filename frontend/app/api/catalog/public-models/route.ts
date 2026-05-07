import { NextResponse } from 'next/server';
import { loadLocalPublicCatalog } from '@/lib/catalog/localPublicCatalog';

export async function GET() {
  try {
    const response = await loadLocalPublicCatalog();
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '模型目录加载失败';
    return new NextResponse(message, { status: 500 });
  }
}
