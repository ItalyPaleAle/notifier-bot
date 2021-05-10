/*
 * This file contains the code that validates the Authorization header in requests coming from the Bot Service.
 * Reference: https://docs.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-connector-authentication
 */

import {JWSHeaderParameters, jwtVerify, KeyLike} from 'jose/jwt/verify'
import {JWK} from './lib/jwk'

const jwk = new JWK(AUTH_JWKS_URI)

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
        const {payload} = await jwtVerify(idToken, getJwk, {
            issuer: AUTH_ISSUER,
            audience: TEAMS_APP_ID,
            algorithms: ['RS256'],
            clockTolerance: 5 * 60,
        })
        return {
            claims: payload,
        }
    } catch (err) {
        if (err) {
            console.error('Error validating JWT', err, (err as Error).stack)
        }
        return {error: 'Invalid JWT'}
    }
}

/** Type of the response from CheckAuth. May contain an error. */
export type CheckAuthResponse = {
    /** Claims */
    claims?: any
    /** Error, if any */
    error?: string
}

const getJwk = (protectedHeader: JWSHeaderParameters): Promise<KeyLike> =>
    jwk.getKey(protectedHeader)
