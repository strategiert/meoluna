import type { Id } from "../../convex/_generated/dataModel";

type GenerateUploadUrl = () => Promise<string>;

type SaveFileMetadata = (args: {
  storageId: Id<"_storage">;
  fileName: string;
  fileType: string;
  fileSize: number;
  userId?: string;
}) => Promise<{
  storageId: Id<"_storage">;
  url: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
}>;

export async function uploadFileToConvexStorage({
  file,
  generateUploadUrl,
  saveFileMetadata,
  userId,
}: {
  file: File;
  generateUploadUrl: GenerateUploadUrl;
  saveFileMetadata?: SaveFileMetadata;
  userId?: string;
}): Promise<{
  storageId: Id<"_storage">;
  url: string | null;
}> {
  const uploadUrl = await generateUploadUrl();
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Upload fehlgeschlagen (${response.status})`);
  }

  const result = (await response.json()) as { storageId?: string };
  if (!result.storageId) {
    throw new Error("Upload-Antwort enthielt keine storageId.");
  }

  const storageId = result.storageId as Id<"_storage">;
  if (!saveFileMetadata) {
    return { storageId, url: null };
  }

  const metadata = await saveFileMetadata({
    storageId,
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    fileSize: file.size,
    userId,
  });

  return { storageId, url: metadata.url };
}
