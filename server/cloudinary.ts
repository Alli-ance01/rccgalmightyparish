import { v2 as cloudinary } from "cloudinary";
import { ENV } from "./_core/env";

type TapMediaType = "image" | "video" | "document";

function credentialsConfigured() {
  return Boolean(ENV.cloudinaryCloudName && ENV.cloudinaryApiKey && ENV.cloudinaryApiSecret);
}

function configureCloudinary() {
  if (!credentialsConfigured()) throw new Error("Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to Render.");
  cloudinary.config({ cloud_name: ENV.cloudinaryCloudName, api_key: ENV.cloudinaryApiKey, api_secret: ENV.cloudinaryApiSecret, secure: true });
}

export function cloudinaryConfigurationStatus() {
  return { configured: credentialsConfigured(), cloudName: ENV.cloudinaryCloudName || null };
}

export async function verifyCloudinaryConfiguration() {
  const status = cloudinaryConfigurationStatus();
  if (!status.configured) return { ...status, verified: false, message: "Cloudinary credentials are missing." };
  configureCloudinary();
  try {
    await cloudinary.api.ping();
    return { ...status, verified: true, message: "Cloudinary credentials were accepted." };
  } catch {
    return { ...status, verified: false, message: "Cloudinary could not verify the configured credentials." };
  }
}

export async function uploadToCloudinary(input: { dataUrl: string; mediaType: TapMediaType; filename: string; contentType: string; uploaderId: string }) {
  configureCloudinary();
  const resourceType = input.mediaType === "document" ? "raw" : input.mediaType;
  const folder = `tap-church/${resourceType}s`;
  const safeName = input.filename.toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-");
  const result = await cloudinary.uploader.upload(input.dataUrl, {
    resource_type: resourceType,
    folder,
    public_id: `${input.uploaderId}-${Date.now()}-${safeName.replace(/\.[^.]+$/, "")}`,
    filename_override: safeName,
    use_filename: true,
    unique_filename: false,
    overwrite: false,
  });
  return { publicId: result.public_id, secureUrl: result.secure_url, mimeType: input.contentType || result.format || "application/octet-stream" };
}
