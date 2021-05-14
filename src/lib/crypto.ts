import {Encode as B64Encode} from './base64'

/**
 * Returns the SHA-256 hash of a string, encoded as base64
 * @param str String to hash
 * @returns The SHA-256 hash of the string, base64-encoded
 */
export async function SHA256String(str: string): Promise<string> {
    const buf = new TextEncoder().encode(str)
    const hash = await crypto.subtle.digest('SHA-256', buf)
    return B64Encode(hash)
}
