// ============================================================================
// fal.ai API Client - Image generation for Pipeline V2
// ============================================================================

export interface FalImageRequest {
  prompt: string;
  aspectRatio: "16:9" | "1:1" | "4:3";
  timeoutMs?: number;
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

const FAL_MODEL_PATH = "fal-ai/flux/schnell";
const FAL_STATUS_MODEL_PATH = "fal-ai/flux";

interface FalQueueSubmitResponse {
  request_id?: string;
  status_url?: string;
  response_url?: string;
  cancel_url?: string;
}

interface FalQueueStatusResponse {
  status?: string;
  response_url?: string;
  error?: unknown;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function extractImageUrl(payload: unknown): string | null {
  const data = payload as Record<string, unknown>;
  const fromRoot = (data?.images as Array<{ url?: string }> | undefined)?.[0]?.url;
  if (typeof fromRoot === "string" && fromRoot.length > 0) return fromRoot;

  const responseObj = data?.response as Record<string, unknown> | undefined;
  const fromResponse = (responseObj?.images as Array<{ url?: string }> | undefined)?.[0]?.url;
  if (typeof fromResponse === "string" && fromResponse.length > 0) return fromResponse;

  const resultObj = data?.result as Record<string, unknown> | undefined;
  const fromResult = (resultObj?.images as Array<{ url?: string }> | undefined)?.[0]?.url;
  if (typeof fromResult === "string" && fromResult.length > 0) return fromResult;

  return null;
}

/**
 * Generates a single image using fal.ai Queue API (FLUX Schnell).
 * Returns the temporary URL (must be downloaded and stored before it expires).
 */
export async function generateImage(request: FalImageRequest): Promise<FalImageResult> {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) {
    console.warn("FAL_API_KEY nicht konfiguriert - Asset-Generierung übersprungen");
    return { url: null, error: "FAL_API_KEY not configured" };
  }

  const totalTimeoutMs = request.timeoutMs ?? 35000;
  const deadline = Date.now() + totalTimeoutMs;
  const authHeaders = {
    "Authorization": `Key ${apiKey}`,
    "Content-Type": "application/json",
    "x-fal-request-timeout": String(Math.max(10, Math.min(60, Math.ceil(totalTimeoutMs / 1000)))),
  };

  let requestId = "";
  let statusUrl = "";
  let responseUrl = "";
  let cancelUrl = "";

  try {
    const submitResponse = await fetchWithTimeout(
      `https://queue.fal.run/${FAL_MODEL_PATH}`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          prompt: request.prompt,
          image_size: ASPECT_RATIO_MAP[request.aspectRatio] || "square",
          num_images: 1,
          enable_safety_checker: true,
        }),
      },
      Math.min(12000, totalTimeoutMs)
    );

    if (!submitResponse.ok) {
      const error = await submitResponse.text();
      console.error(`fal.ai queue submit error: ${submitResponse.status} - ${error}`);
      return { url: null, error: `fal.ai queue submit ${submitResponse.status}` };
    }

    const submitData = (await submitResponse.json()) as FalQueueSubmitResponse;
    requestId = submitData.request_id ?? "";
    if (!requestId) {
      return { url: null, error: "fal.ai queue submit missing request_id" };
    }

    statusUrl = submitData.status_url
      ?? `https://queue.fal.run/${FAL_STATUS_MODEL_PATH}/requests/${requestId}/status`;
    responseUrl = submitData.response_url
      ?? `https://queue.fal.run/${FAL_STATUS_MODEL_PATH}/requests/${requestId}`;
    cancelUrl = submitData.cancel_url
      ?? `https://queue.fal.run/${FAL_STATUS_MODEL_PATH}/requests/${requestId}/cancel`;

    while (Date.now() < deadline) {
      const remainingMs = Math.max(1000, deadline - Date.now());
      const statusResponse = await fetchWithTimeout(
        statusUrl,
        { method: "GET", headers: { "Authorization": `Key ${apiKey}` } },
        Math.min(8000, remainingMs)
      );

      if (!statusResponse.ok) {
        const error = await statusResponse.text();
        console.error(`fal.ai queue status error: ${statusResponse.status} - ${error}`);
        if (statusResponse.status === 429 || statusResponse.status >= 500) {
          await sleep(1200);
          continue;
        }
        return { url: null, error: `fal.ai queue status ${statusResponse.status}` };
      }

      const statusData = (await statusResponse.json()) as FalQueueStatusResponse;
      const status = String(statusData.status ?? "");

      if (status === "COMPLETED") {
        if (statusData.response_url) responseUrl = statusData.response_url;
        break;
      }

      if (status === "FAILED" || status === "CANCELLED") {
        const error = typeof statusData.error === "string"
          ? statusData.error
          : JSON.stringify(statusData.error ?? {});
        return { url: null, error: `fal.ai queue ${status}: ${error}` };
      }

      await sleep(1200);
    }

    if (Date.now() >= deadline) {
      if (cancelUrl) {
        try {
          await fetchWithTimeout(
            cancelUrl,
            { method: "PUT", headers: { "Authorization": `Key ${apiKey}` } },
            5000
          );
        } catch {
          // Ignore cancel errors.
        }
      }
      return { url: null, error: `fal.ai queue timeout after ${totalTimeoutMs}ms` };
    }

    const remainingMs = Math.max(1000, deadline - Date.now());
    const resultResponse = await fetchWithTimeout(
      responseUrl,
      { method: "GET", headers: { "Authorization": `Key ${apiKey}` } },
      Math.min(10000, remainingMs)
    );

    if (!resultResponse.ok) {
      const error = await resultResponse.text();
      console.error(`fal.ai queue result error: ${resultResponse.status} - ${error}`);
      return { url: null, error: `fal.ai queue result ${resultResponse.status}` };
    }

    const resultData = await resultResponse.json();
    const imageUrl = extractImageUrl(resultData);
    if (!imageUrl) {
      return { url: null, error: "No image URL in fal.ai queue result" };
    }

    return { url: imageUrl };
  } catch (e) {
    const msg = e instanceof Error && e.name === "AbortError"
      ? `fal.ai queue timeout near request ${requestId || "unknown"}`
      : e instanceof Error
        ? e.message
        : "Unknown error";
    console.error(`fal.ai queue call failed: ${msg}`);
    return { url: null, error: msg };
  }
}

/**
 * Downloads an image from a URL and returns it as a Blob.
 * Used to persist fal.ai temporary URLs into Convex storage.
 */
export async function downloadImage(url: string): Promise<Blob | null> {
  try {
    const response = await fetchWithTimeout(url, { method: "GET" }, 12000);
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
