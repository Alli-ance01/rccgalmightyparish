# Production authentication debug finding

The Vercel frontend initially received an empty or non-JSON response while the Render API was asleep. Opening the Render API showed the Render “Application loading” interstitial; after the cold start completed, the same API URL returned `{"service":"TAP Church API","status":"ok"}`.

The client should convert non-JSON and temporary API-wake responses into a clear retryable message rather than surfacing a JSON parser exception. Render free-service cold starts can still delay the first request; an always-on API host is required to eliminate that delay entirely.
