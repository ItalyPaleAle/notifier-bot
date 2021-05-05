import IdTokenVerifier from "@italypaleale/idtoken-verifier"

/*
 * This file contains the code that validates the Authorization header in requests coming from the Bot Service.
 * Reference: https://docs.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-connector-authentication
 */

/** Verifier for the id_token */
const verifier = new IdTokenVerifier({
    issuer: AUTH_ISSUER,
    audience: TEAMS_APP_ID,
    jwksURI: AUTH_JWKS,
    expectedAlg: 'RS256',
    leeway: 60 * 5,
    // TODO: JWK cache that uses Workers KV
    jwksCache: new Map(),
})

/**
 * Checks if the value of the Authorization header for messages coming from Bot Service is valid.
 * 
 * @param req Request object
 * @returns The response is a dictionary that contains the claims or the error that occurred in the method
 */
export async function CheckAuth(req: Request): Promise<CheckAuthResponse> {
    // Get the authorization header and get the JWT
    const auth = req.headers.get('authorization')
    if (!auth) {
        return {error: 'Missing Authorization header'}
    }
    const match = auth.match(
        /^(?:Bearer )?([A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+\/=]*)$/
    )
    if (!match || match.length != 2) {
        return {error: 'Invalid Authorization header'}
    }
    const idToken = match[1]

    // Validate the id_token
    try {
        console.log(idToken)
        const payload = await new Promise((resolve, reject) => {
            verifier.verify(idToken, (err, payload) => {
                if (err) {
                    console.log('Error here', err)
                    return reject(err)
                }
                resolve(payload)
            })
        })
        console.log(payload)
    } catch (err) {
        if (err) {
            console.error('Error validating JWT', err, (err as Error).stack)
        }
        return {error: 'Invalid JWT'}
    }

    return {}
}

export type CheckAuthResponse = {
    /** Claims */
    claims?: any
    /** Error, if any */
    error?: string
}
