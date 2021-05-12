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

        // Refresh the token and then return it
        await this.refreshToken()
        return this.token!
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

        // Store the token
        this.token = tokenRes.access_token
        this.expiry = Date.now() + tokenRes.expires_in
    }
}

/** Singleton for AccessToken */
export const accessToken = new AccessToken(
    TEAMS_TOKEN_ENDPOINT,
    TEAMS_APP_ID,
    TEAMS_APP_PASSWORD
)
export default accessToken
