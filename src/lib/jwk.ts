import {JWSHeaderParameters, JWK as IJWK} from 'jose/webcrypto/types'
import {parseJwk} from 'jose/jwk/parse'

/** Minimum interval between requests of the JWKS (in ms) */
const jwksFetchCooldown = 10 * 60 * 1000

/** How long to cache JWKS in the edge (in seconds) */
const jwksEdgeCache = 30 * 60

type keyCache = Map<string, IJWK>

/**
 * Manages JWK and requests them from the JWKS
 */
export class JWK {
    _jwksUri: string = ''
    _lastUpdate?: number
    _keyCache?: keyCache
    _fetching?: Promise<keyCache>

    /**
     * Constructor - initializes the object
     * @param jwksUri URI of the JWKS file
     */
    constructor(jwksUri: string) {
        this._jwksUri = jwksUri
    }

    /**
     * Returns the data for the key specified in the token's header.
     * Refreshes the data from the JWKS if necessary.
     *
     * @param protectedHeader Protected header from the JWT
     * @returns The key object
     */
    async getKey(protectedHeader: JWSHeaderParameters): Promise<CryptoKey> {
        // Ensure the key is in the correct format
        if (
            !protectedHeader ||
            !protectedHeader.kid ||
            protectedHeader.alg != 'RS256'
        ) {
            throw Error(
                'Invalid protectedHeader argument: kid and/or alg are invalid or empty. KID: ' +
                    protectedHeader?.kid +
                    '; ALG: ' +
                    protectedHeader?.alg
            )
        }

        // Return the key from the cache if we have it
        let cached = await this.cryptoKeyFromCache(protectedHeader.kid)
        if (cached) {
            return cached
        }

        // Request the JWKS only if we're past the cooldown period
        if (this.isCoolingDown()) {
            throw Error('No key found')
        }

        // Request the JWKS
        if (!this._fetching) {
            // Make only one request in parallel
            this._fetching = this.fetchJWKS()
        }
        const keys = await this._fetching
        this._fetching = undefined
        this._lastUpdate = Date.now()
        this._keyCache = keys

        // Return the key
        // If the key is still not in the cache, then throw an exception
        cached = await this.cryptoKeyFromCache(protectedHeader.kid)
        if (!cached) {
            throw Error('No key found')
        }
        return cached
    }

    /**
     * Returns a key from cache as a cryptoKey object
     * @param kid Key ID
     * @returns The CryptoKey (a KeyLike object) with the key
     */
    async cryptoKeyFromCache(kid: string): Promise<CryptoKey | null> {
        if (!this._keyCache?.has(kid)) {
            return null
        }
        const k = this._keyCache.get(kid)!

        // Convert to a cryptoKey
        const obj = (await parseJwk(k, 'RS256')) as CryptoKey
        if (!obj || obj.type != 'public') {
            throw new Error('Found a non-public key')
        }

        return obj
    }

    /**
     * Requests the JWKS and returns the list of keys found
     *
     * @returns List of keys in the JWKS
     */
    async fetchJWKS(): Promise<keyCache> {
        // Request the JWKS; this can be cached in the Cloudflare cache
        const res = await fetch(AUTH_JWKS_URI, {
            // Cloudflare-specific options
            cf: {
                // Force caching
                cacheEverything: true,
                // Cache successful responses only
                cacheTtl: jwksEdgeCache,
                cacheTtlByStatus: {
                    '200-299': jwksEdgeCache,
                    '400-499': 10,
                    '500-599': 0,
                },
            },
        })
        if (res.status < 200 || res.status > 299) {
            throw Error('Invalid response status code')
        }
        const keys = await res.json()
        if (!keys || typeof keys != 'object' || !Array.isArray(keys.keys)) {
            throw Error('Invalid JWKS response format')
        }

        // Get all the keys
        const result = new Map()
        for (let i = 0; i < keys.keys.length; i++) {
            const k = keys.keys[i] as IJWK
            if (!k || k.kty != 'RSA' || !k.kid || !k.n || !k.e) {
                continue
            }
            result.set(k.kid, k)
        }

        return result
    }

    /**
     * Returns true if it's been too soon since the last request of the JWKS
     *
     * @returns True if it's been too soon since the last request
     */
    isCoolingDown(): boolean {
        return !!(
            this._lastUpdate &&
            this._lastUpdate > Date.now() - jwksFetchCooldown
        )
    }
}
