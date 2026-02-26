import { BlockDSLDocument, BlockNode } from "@/lib/site-studio/types";

export function findBlockById(
  blocks: BlockNode[],
  blockId: string,
): BlockNode | null {
  const stack = [...blocks];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    if (current.id === blockId) return current;
    if (Array.isArray(current.children)) {
      stack.push(...current.children);
    }
  }
  return null;
}

export function flattenBlocks(
  blocks: BlockNode[],
  depth = 0,
): Array<{ block: BlockNode; depth: number }> {
  const output: Array<{ block: BlockNode; depth: number }> = [];
  for (const block of blocks) {
    output.push({ block, depth });
    if (Array.isArray(block.children) && block.children.length > 0) {
      output.push(...flattenBlocks(block.children, depth + 1));
    }
  }
  return output;
}

export function sanitizeDocument(document: BlockDSLDocument): BlockDSLDocument {
  return {
    ...document,
    version: Number.isFinite(document.version) ? document.version : 1,
    pageMeta: {
      title: document.pageMeta?.title ?? "Untitled page",
      slug: document.pageMeta?.slug ?? "untitled-page",
      description: document.pageMeta?.description,
    },
    blocks: Array.isArray(document.blocks) ? document.blocks : [],
    globalBindings: document.globalBindings ?? {},
    assets: Array.isArray(document.assets) ? document.assets : [],
  };
}

