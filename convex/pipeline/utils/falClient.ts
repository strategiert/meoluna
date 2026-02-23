// ============================================================================
// fal.ai API Client - Image generation for Pipeline V2
// ============================================================================

export interface FalImageRequest {
  prompt: string;
  aspectRatio: "16:9" | "1:1" | "4:3";
}

export interface FalImageResult {
  url: string | null;
  error?: string;
}

const ASPECT_RATIO_MAP: Record<string, string> = {
  "16:9": "landscape_16_9",
  "4:3": "landscape_4_3",
  "1:1": "square",
};

/**
 * Generates a single image using fal.ai FLUX Schnell.
 * Returns the temporary URL (must be downloaded and stored before it expires).
 */
export async function generateImage(request: FalImageRequest): Promise<FalImageResult> {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) {
    console.warn("FAL_API_KEY nicht konfiguriert - Asset-Generierung übersprungen");
    return { url: null, error: "FAL_API_KEY not configured" };
  }

  try {
    const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Authorization": `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: request.prompt,
        image_size: ASPECT_RATIO_MAP[request.aspectRatio] || "square",
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`fal.ai error: ${response.status} - ${error}`);
      return { url: null, error: `fal.ai ${response.status}` };
    }

    const data = await response.json();
    const imageUrl = data.images?.[0]?.url;

    if (!imageUrl) {
      return { url: null, error: "No image URL in response" };
    }

    return { url: imageUrl };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error(`fal.ai call failed: ${msg}`);
    return { url: null, error: msg };
  }
}

/**
 * Downloads an image from a URL and returns it as a Blob.
 * Used to persist fal.ai temporary URLs into Convex storage.
 */
export async function downloadImage(url: string): Promise<Blob | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Image download failed: ${response.status}`);
      return null;
    }
    const buffer = await response.arrayBuffer();
    return new Blob([buffer], { type: "image/webp" });
  } catch (e) {
    console.error(`Image download error: ${e instanceof Error ? e.message : "Unknown"}`);
    return null;
  }
}
