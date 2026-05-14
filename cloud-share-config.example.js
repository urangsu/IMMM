/**
 * IMMM Cloud Share Configuration Example
 *
 * This file demonstrates how to configure cloud storage for IMMM result sharing.
 * Copy and adapt this configuration to your environment.
 *
 * For production, load this configuration from a secure source and inject into
 * window.IMMM_CLOUD_SHARE_CONFIG before any IMMM scripts load.
 */

// ============================================================================
// ENDPOINT-BASED CONFIGURATION (Custom HTTP Upload Endpoint)
// ============================================================================
//
// Use this when you have your own upload endpoint that:
// 1. Accepts multipart/form-data POST requests with 'file' and optional 'metadata'
// 2. Returns JSON with remoteUrl, url, or publicUrl field
// 3. Stores files and provides public HTTP(S) URLs for retrieval
//

const ENDPOINT_CONFIG = {
  enabled: true,
  provider: 'endpoint',
  uploadEndpoint: 'https://api.example.com/v1/upload',
  publicBaseUrl: 'https://cdn.example.com',
  expiresInSec: 604800, // 7 days
  bucket: 'immm-results'
};

// ============================================================================
// SUPABASE STORAGE CONFIGURATION (Recommended)
// ============================================================================
//
// Use this when you have a Supabase project with storage enabled.
//
// Setup steps:
// 1. Create a Supabase project at https://supabase.com
// 2. Navigate to Storage and create a public bucket named 'immm-results'
// 3. Get your project URL and anonymous key from Settings > API
// 4. Copy the values below
//

const SUPABASE_CONFIG = {
  enabled: true,
  provider: 'supabase',
  supabaseUrl: 'https://your-project-id.supabase.co',
  supabaseAnonKey: 'your-public-anon-key-here',
  supabaseBucket: 'immm-results',
  expiresInSec: 604800 // 7 days
};

// ============================================================================
// INJECTION PATTERN
// ============================================================================
//
// Add this code to your HTML <head>, BEFORE loading any IMMM scripts:
//

/*
<script>
  window.IMMM_CLOUD_SHARE_CONFIG = {
    enabled: true,
    provider: 'supabase',  // 'endpoint' or 'supabase'
    // ... rest of config
  };
</script>
<script src="./dist/app.js"></script>
<!-- ... other IMMM scripts ... -->
*/

// ============================================================================
// DEVELOPMENT / DISABLED CONFIGURATION
// ============================================================================
//

const DISABLED_CONFIG = {
  enabled: false,
  provider: 'none'
};

// ============================================================================
// SECURITY NOTES
// ============================================================================
//
// - Only public configuration is exposed in the browser
// - Never commit private keys, service_role keys, or secrets to repositories
// - Always use public/anonymous keys for browser clients
// - Supabase anonymous keys only allow uploads, not deletions
// - For production, use environment variables or secure configuration services
// - Validate all uploaded files on your server side
// - Implement rate limiting on your upload endpoints
// - Consider adding CORS restrictions to your file storage
//

// ============================================================================
// EXAMPLE: Load from environment
// ============================================================================
//
// Node/build-time (before deploying to browser):
//
// window.IMMM_CLOUD_SHARE_CONFIG = {
//   enabled: process.env.REACT_APP_CLOUD_ENABLED === 'true',
//   provider: process.env.REACT_APP_CLOUD_PROVIDER || 'supabase',
//   uploadEndpoint: process.env.REACT_APP_UPLOAD_ENDPOINT,
//   publicBaseUrl: process.env.REACT_APP_PUBLIC_BASE_URL,
//   supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
//   supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
//   supabaseBucket: process.env.REACT_APP_SUPABASE_BUCKET || 'immm-results'
// };
//
