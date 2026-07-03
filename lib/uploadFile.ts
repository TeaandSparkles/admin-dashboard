import { supabase } from "./supabaseClient";

export interface UploadResult {
  path: string;
  publicUrl: string;
}

/**
 * Upload a File to a Supabase Storage bucket and return its public URL.
 * `prefix` groups files by area, e.g. "novels" or `stories/${storyId}`.
 */
export async function uploadFile(
  bucket: "covers" | "media",
  file: File,
  prefix: string,
): Promise<UploadResult> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = prefix ? `${prefix.replace(/\/$/, "")}/${safeName}` : safeName;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
