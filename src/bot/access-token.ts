const AccessTokenKVKey = '__access_token'

type AccessTokenKV = {
    token: string
    expiry: number
}

/**
 * Used to manage the access token to send requests to the Bot Service.
 * Most times you want to use the singleton and invoke the `getToken()` method
 */
export class AccessToken {
    private tokenEndpoint: string
    private appId: string
    private appPassword: string
    private token?: string
    private expiry?: number

    constructor(tokenEndpoint: string, appId: string, appPassword: string) {
        this.tokenEndpoint = tokenEndpoint
        this.appId = appId
        this.appPassword = appPassword
    }

    /**
     * Returns the access token to make requests to the Bot Service.
     * If the token isn't available, or has expires, requests a new one.
     * @returns Access token
     */
    public async getToken(): Promise<string> {
        // Return the cached token if it's still valid
        if (this.token && Date.now() < (this.expiry || 0)) {
            return this.token
        }

        // Try loading it from Workers KV
        if (await this.loadTokenFromKV()) {
            return this.token!
        }

        // Refresh the token and then return it
        await this.refreshToken()
        return this.token!
    }

    /**
     * Tries loading the token from the cache in Workers KV
     * @returns A boolean indicating if the token was loaded successfully
     */
    private async loadTokenFromKV(): Promise<boolean> {
        // Try loading from KV
        try {
            const read = await WEBHOOKS.get(AccessTokenKVKey)
            if (read) {
                const parsed = JSON.parse(read) as AccessTokenKV
                if (!parsed || !parsed.token || !parsed.expiry) {
                    return false
                }

                // Check if the token has at least 15 seconds of validity
                if (Date.now() < parsed.expiry - 15 * 1000) {
                    this.token = parsed.token
                    this.expiry = parsed.expiry
                    return true
                }
            }
        } catch (err) {
            console.log('Caught exception while requesting access token from KV', err)
        }
        return false
    }

    /**
     * Requests a new access token
     */
    public async refreshToken() {
        // Spec: https://docs.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-connector-authentication?view=azure-bot-service-4.0#bot-to-connector
        console.info('Requesting a new access token')

        // Request body parameters (form-urlencoded)
        const vals = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.appId,
            client_secret: this.appPassword,
            scope: 'https://api.botframework.com/.default',
        })

        // Request the new token
        const res = await fetch(this.tokenEndpoint, {
            method: 'POST',
            body: vals,
        })
        if (!res?.ok) {
            throw Error('Invalid response status code: ' + res.status)
        }

        // Parse the response and extract the token
        const tokenRes = (await res.json()) as {
            token_type: string
            expires_in: number | string
            access_token: string
        }
        if (
            !tokenRes ||
            !tokenRes.access_token ||
            !tokenRes.expires_in ||
            tokenRes.token_type != 'Bearer'
        ) {
            throw Error('Invalid response: not an access token')
        }
        if (typeof tokenRes.expires_in == 'string') {
            tokenRes.expires_in = parseInt(tokenRes.expires_in, 10)
        }

        // Store the token in the object
        this.token = tokenRes.access_token
        this.expiry = Date.now() + tokenRes.expires_in

        // Cache in the KV
        const store: AccessTokenKV = {
            token: this.token,
            expiry: this.expiry,
        }
        await WEBHOOKS.put(AccessTokenKVKey, JSON.stringify(store), {
            // Make this expire 2 mins before the token expires
            expirationTtl: tokenRes.expires_in - 120,
        })
    }
}

/** Singleton for AccessToken */
export const accessToken = new AccessToken(
    TEAMS_TOKEN_ENDPOINT,
    TEAMS_APP_ID,
    TEAMS_APP_PASSWORD
)
export default accessToken
