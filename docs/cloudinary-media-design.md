# Cloudinary media design

TAP will upload media from its approved staff API to Cloudinary using server-side, signed credentials. Images use the `image` resource type, videos use `video`, and documents use `raw`. MongoDB will retain the Cloudinary public ID, secure delivery URL, MIME type, publishing state, and TAP content metadata; no media bytes or Cloudinary API secrets will be stored in MongoDB or exposed to the browser.

For the initial workflow, uploads remain subject to the existing server request-size limit. Larger video uploads should move to Cloudinary's signed direct-upload or chunked-upload workflow in a later release.

Reference: https://cloudinary.com/documentation/node_image_and_video_upload
