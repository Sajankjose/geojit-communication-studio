import { supabase } from "../../lib/supabase";

export const PDF_BUCKET = "communication-sources";
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

export interface SourceFileMetadata {
  bucket: string;
  path: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export function validatePdfFile(file: File): string | null {
  if (!file) return "Please choose a PDF file.";

  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return "Only PDF files are supported.";
  }

  if (file.size <= 0) {
    return "This PDF appears to be empty.";
  }

  if (file.size < 1024) {
    return "This PDF is unusually small and may be blank or invalid.";
  }

  if (file.size > MAX_PDF_BYTES) {
    return "PDF must be 10 MB or smaller.";
  }

  return null;
}

export async function uploadCommunicationPdf({
  communicationId,
  file,
}: {
  communicationId: string;
  file: File;
}): Promise<SourceFileMetadata> {
  const validationError = validatePdfFile(file);
  if (validationError) throw new Error(validationError);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const safeName = sanitizeFileName(file.name);
  const path = `${user.id}/${communicationId}/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(PDF_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) throw new Error(error.message);

  return {
    bucket: PDF_BUCKET,
    path: data.path,
    name: file.name,
    size: file.size,
    mimeType: "application/pdf",
    uploadedAt: new Date().toISOString(),
  };
}

export async function removeCommunicationPdf(path: string) {
  if (!path) return;

  const { error } = await supabase.storage
    .from(PDF_BUCKET)
    .remove([path]);

  if (error) throw new Error(error.message);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  return `${(kb / 1024).toFixed(1)} MB`;
}

function sanitizeFileName(fileName: string) {
  const base = fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");

  if (!base) return "source.pdf";

  return base.toLowerCase().endsWith(".pdf")
    ? base
    : `${base}.pdf`;
}
