export {}

declare global {
    // Constants from the environment
    // This is used during development to expose the Bot Framework Emulator that's running on localhost
    const SERVICE_URL_OVERRIDE: string | null | undefined

    // Constants from wrangler.toml
    const BASE_URL: string
    const TEAMS_TOKEN_ENDPOINT: string
    const TEAMS_APP_ID: string
    const AUTH_JWKS_URI: string
    const AUTH_ISSUER: string

    // Secrets from Cloudflare Workers runtime
    const TEAMS_APP_PASSWORD: string

    // Cloudflare Workers KV namespaces
    const WEBHOOKS: KVNamespace
}
