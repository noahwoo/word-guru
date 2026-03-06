// config.js — environment configuration
// Toggle IS_DEV before building for production.
// The production URL MUST be HTTPS and added to the request domain whitelist in:
//   WeChat Official Account Platform > Development > Server Domain > request合法域名

const IS_DEV = true

const BACKEND_BASE_URL = IS_DEV
  ? 'http://localhost:3000'
  : 'https://your-production-domain.com'

// ── Direct LLM access (bypasses the Next.js backend) ──────────────────────────
// Set USE_DIRECT_LLM = true to call the Qianfan API from the miniprogram directly.
// When true, BACKEND_BASE_URL is ignored for story generation.
// The bearerToken must be added to the WeChat platform's request domain whitelist:
//   qianfan.baidubce.com
const USE_DIRECT_LLM = false

const LLM_CONFIG = {
  url:         'https://qianfan.baidubce.com/v2/chat/completions',
  model:       'deepseek-v3.2',
  bearerToken: 'YOUR_BEARER_TOKEN_HERE',  // replace before enabling USE_DIRECT_LLM
}

module.exports = {
  BACKEND_BASE_URL,
  USE_DIRECT_LLM,
  LLM_CONFIG,
  API: {
    GENERATE_STORY: `${BACKEND_BASE_URL}/api/generate-story`,
  },
}
