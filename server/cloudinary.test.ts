import { describe, expect, it, vi } from "vitest";

vi.mock("./_core/env", () => ({
  ENV: {
    cloudinaryCloudName: "",
    cloudinaryApiKey: "",
    cloudinaryApiSecret: "",
  },
}));

import { cloudinaryConfigurationStatus, verifyCloudinaryConfiguration } from "./cloudinary";

describe("Cloudinary server adapter", () => {
  it("reports missing configuration without exposing credential values or making an external request", async () => {
    expect(cloudinaryConfigurationStatus()).toEqual({ configured: false, cloudName: null });
    await expect(verifyCloudinaryConfiguration()).resolves.toEqual({
      configured: false,
      cloudName: null,
      verified: false,
      message: "Cloudinary credentials are missing.",
    });
  });
});
