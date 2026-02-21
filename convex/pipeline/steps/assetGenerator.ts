// ============================================================================
// STEP 5: ASSET GENERATION - Bilder via fal.ai generieren (PARALLEL)
// Kein LLM-Call, rein programmatisch
// ============================================================================

import { generateImage, downloadImage } from "../utils/falClient";
import type { AssetPlannerOutput, AssetManifest } from "../types";

interface StorageContext {
  store: (blob: Blob) => Promise<string>;
  getUrl: (id: string) => Promise<string | null>;
}

export async function runAssetGenerator(
  assetPlan: AssetPlannerOutput,
  storage: StorageContext
): Promise<AssetManifest> {
  const manifest: AssetManifest = {};

  // Filter: skip nice-to-have if we have > 8 assets
  const assetsToGenerate = assetPlan.assets.filter(
    (asset) => asset.priority !== "nice-to-have" || assetPlan.assets.length <= 8
  );

  // Generate all images in PARALLEL
  const promises = assetsToGenerate.map(async (asset) => {
    const fullPrompt = `${asset.prompt}, ${assetPlan.styleBase}`;

    const result = await generateImage({
      prompt: fullPrompt,
      aspectRatio: asset.aspectRatio,
    });

    if (result.url) {
      // Download and persist to Convex storage (fal.ai URLs are temporary)
      const blob = await downloadImage(result.url);

      if (blob) {
        try {
          const storageId = await storage.store(blob);
          const permanentUrl = await storage.getUrl(storageId);

          manifest[asset.id] = {
            url: permanentUrl,
            storageId,
            category: asset.category,
            purpose: asset.purpose,
          };
        } catch (e) {
          console.error(`Storage failed for ${asset.id}:`, e);
          manifest[asset.id] = {
            url: null,
            storageId: null,
            category: asset.category,
            purpose: asset.purpose,
          };
        }
      } else {
        manifest[asset.id] = {
          url: null,
          storageId: null,
          category: asset.category,
          purpose: asset.purpose,
        };
      }
    } else {
      // fal.ai failed — mark as null (SVG fallback will be used)
      manifest[asset.id] = {
        url: null,
        storageId: null,
        category: asset.category,
        purpose: asset.purpose,
      };
    }
  });

  await Promise.all(promises);

  // Debug-Log: Zusammenfassung des Manifests
  const total = Object.keys(manifest).length;
  const withUrl = Object.values(manifest).filter(e => e.url).length;
  const byCategory = Object.values(manifest).reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});
  console.log(`[AssetGenerator] ${withUrl}/${total} Assets generiert. Kategorien:`, JSON.stringify(byCategory));

  return manifest;
}
