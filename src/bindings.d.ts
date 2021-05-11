export {}

declare global {
    // Constants
    const TEAMS_APP_ID: string
    const AUTH_JWKS_URI: string
    const AUTH_ISSUER: string

    // KV namespaces
    const WEBHOOKS: KVNamespace
}
