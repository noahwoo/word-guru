// config.js — environment configuration
// Toggle IS_DEV before building for production.
// The production URL MUST be HTTPS and added to the request domain whitelist in:
//   WeChat Official Account Platform > Development > Server Domain > request合法域名

const IS_DEV = true

const BACKEND_BASE_URL = IS_DEV
  ? 'http://localhost:3000'
  : 'https://your-production-domain.com'

module.exports = {
  BACKEND_BASE_URL,
  API: {
    GENERATE_STORY: `${BACKEND_BASE_URL}/api/generate-story`,
  },
}
