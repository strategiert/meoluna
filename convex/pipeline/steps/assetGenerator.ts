// ============================================================================
// STEP 5: ASSET GENERATION - Hybrid assets
// - fal.ai for raster backgrounds
// - Gemini 3.1 Pro for SVG vector assets (icon/illustration/character)
// ============================================================================

import { generateImage, downloadImage } from "../utils/falClient";
import { generateSvgAsset } from "../utils/geminiSvgClient";
import type { AssetPlannerOutput, AssetManifest } from "../types";

interface StorageContext {
  store: (blob: Blob) => Promise<string>;
  getUrl: (id: string) => Promise<string | null>;
}

function isSvgAssetCategory(category: string): boolean {
  return category === "icon" || category === "illustration" || category === "character";
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
  let rasterCount = 0;
  let svgFallbackToRasterCount = 0;

  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENT, assetsToGenerate.length) },
    async () => {
      while (true) {
        const next = cursor++;
        if (next >= assetsToGenerate.length) break;
        const asset = assetsToGenerate[next];
        const fullPrompt = `${asset.prompt}, ${assetPlan.styleBase}`;

        // Vector assets (icon/illustration/character) via Gemini SVG
        if (isSvgAssetCategory(asset.category)) {
          const svgResult = await generateSvgAsset({
            prompt: fullPrompt,
            category: asset.category,
            purpose: asset.purpose,
            aspectRatio: asset.aspectRatio,
            timeoutMs: 25000,
          });

          if (svgResult.svg) {
            await persistManifestEntry(manifest, storage, {
              assetId: asset.id,
              category: asset.category,
              purpose: asset.purpose,
              blob: new Blob([svgResult.svg], { type: "image/svg+xml" }),
            });
            svgCount++;
            continue;
          }

          console.warn(`[AssetGenerator] Gemini SVG failed for ${asset.id}, fallback to raster: ${svgResult.error}`);
          svgFallbackToRasterCount++;
        }

        // Raster backgrounds (and SVG fallback) via fal.ai
        const result = await generateImage({
          prompt: fullPrompt,
          aspectRatio: asset.aspectRatio,
          timeoutMs: 25000,
        });

        if (!result.url) {
          // fal.ai failed — mark as null (Skeleton falls back to no image)
          manifest[asset.id] = {
            url: null,
            storageId: null,
            category: asset.category,
            purpose: asset.purpose,
          };
          continue;
        }

        // Download and persist to Convex storage (fal.ai URLs are temporary)
        const blob = await downloadImage(result.url);

        if (!blob) {
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
          blob,
        });
        rasterCount++;
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
    `[AssetGenerator] Quellen: svg=${svgCount}, raster=${rasterCount}, svgFallbackToRaster=${svgFallbackToRasterCount}`
  );

  return manifest;
}
