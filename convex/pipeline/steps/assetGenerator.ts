// ============================================================================
// STEP 5: ASSET GENERATION - Hybrid assets
// - Gemini Pro (3.x) for ALL visual assets as SVG (background/icon/illustration/character)
// ============================================================================

import { generateSvgAsset } from "../utils/geminiSvgClient";
import type { AssetPlannerOutput, AssetManifest } from "../types";

interface StorageContext {
  store: (blob: Blob) => Promise<string>;
  getUrl: (id: string) => Promise<string | null>;
}

async function persistManifestEntry(
  manifest: AssetManifest,
  storage: StorageContext,
  args: {
    assetId: string;
    category: string;
    purpose: string;
    blob: Blob;
  }
) {
  try {
    const storageId = await storage.store(args.blob);
    const permanentUrl = await storage.getUrl(storageId);

    manifest[args.assetId] = {
      url: permanentUrl,
      storageId,
      category: args.category,
      purpose: args.purpose,
    };
  } catch (e) {
    console.error(`Storage failed for ${args.assetId}:`, e);
    manifest[args.assetId] = {
      url: null,
      storageId: null,
      category: args.category,
      purpose: args.purpose,
    };
  }
}

export async function runAssetGenerator(
  assetPlan: AssetPlannerOutput,
  storage: StorageContext
): Promise<AssetManifest> {
  const manifest: AssetManifest = {};
  const MAX_ASSETS = 8;
  const MAX_CONCURRENT = 4;
  const priorityRank: Record<string, number> = {
    critical: 0,
    important: 1,
    "nice-to-have": 2,
  };

  const assetsToGenerate = [...assetPlan.assets]
    .sort((a, b) => {
      const rankA = priorityRank[a.priority] ?? 9;
      const rankB = priorityRank[b.priority] ?? 9;
      return rankA - rankB;
    })
    .slice(0, MAX_ASSETS);

  console.log(
    `[AssetGenerator] Plane ${assetsToGenerate.length}/${assetPlan.assets.length} Assets ` +
    `(concurrency=${MAX_CONCURRENT})`
  );

  let svgCount = 0;
  let geminiFailedCount = 0;

  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENT, assetsToGenerate.length) },
    async () => {
      while (true) {
        const next = cursor++;
        if (next >= assetsToGenerate.length) break;
        const asset = assetsToGenerate[next];
        const fullPrompt = `${asset.prompt}, ${assetPlan.styleBase}`;

        const svgResult = await generateSvgAsset({
          prompt: fullPrompt,
          category: asset.category,
          purpose: asset.purpose,
          aspectRatio: asset.aspectRatio,
          timeoutMs: 25000,
        });

        if (!svgResult.svg) {
          console.warn(`[AssetGenerator] Gemini SVG failed for ${asset.id}: ${svgResult.error}`);
          geminiFailedCount++;
          manifest[asset.id] = {
            url: null,
            storageId: null,
            category: asset.category,
            purpose: asset.purpose,
          };
          continue;
        }

        await persistManifestEntry(manifest, storage, {
          assetId: asset.id,
          category: asset.category,
          purpose: asset.purpose,
          blob: new Blob([svgResult.svg], { type: "image/svg+xml" }),
        });
        svgCount++;
      }
    }
  );

  await Promise.all(workers);

  // Debug-Log: Zusammenfassung des Manifests
  const total = Object.keys(manifest).length;
  const withUrl = Object.values(manifest).filter(e => e.url).length;
  const byCategory = Object.values(manifest).reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});
  console.log(
    `[AssetGenerator] ${withUrl}/${total} Assets generiert. Kategorien:`,
    JSON.stringify(byCategory)
  );
  console.log(
    `[AssetGenerator] Quellen: svg=${svgCount}, geminiFailed=${geminiFailedCount}`
  );

  return manifest;
}
