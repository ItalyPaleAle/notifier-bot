import {HttpStatusCode} from './http-status-codes'

/** Options for the `ErrorResponse` method */
export type ErrorResponseOpts = {
    /** Status code */
    status: HttpStatusCode
    /** Error message */
    message: string
    /** Optional data */
    data?: any
    /** Optional headers */
    headers?: Record<string, string>
}

/**
 * Create a Response that contains an error
 *
 * @param opts Options for the method
 * @returns A Response object that can be sent to the client
 */
export function ErrorResponse(opts: ErrorResponseOpts): Response {
    if (!opts || !opts.status || !opts.message) {
        throw Error('Missing required parameters')
    }

    // Response body
    const body: any = {
        error: opts.message,
    }
    if (opts.data) {
        body.data = opts.data
    }

    // Headers
    const headers = {...(opts.headers ?? {})}
    headers['Content-Type'] = 'application/json; charset=UTF-8'

    // Response object
    return new Response(JSON.stringify(body), {
        status: opts.status,
        headers,
    })
}

/**
 * Returns an ErrorResponse for an Internal Server Error (500)
 * @returns A Response object that can be sent to the client
 */
export function InternalServerErrorResponse(): Response {
    return ErrorResponse({
        status: HttpStatusCode.InternalServerError,
        message: 'An internal error occurred',
    })
}

/**
 * Read from a ReadableStream up to a certain length, then close the input stream
 * Note: this uses `Strings.prototype.length` so it counts the number of Unicode codepoints
 * @param stream Stream to read from
 * @param limit Limit of characters to read
 * @returns A string which is truncated at `limit`
 */
export async function LimitReader(
    stream: ReadableStream<Uint8Array>,
    limit: number
): Promise<string> {
    if (!stream) {
        throw Error('Parameter stream is empty')
    }
    if (limit < 1) {
        throw Error('Parameter limit must be greater than 1')
    }

    const reader = stream.getReader()
    const utf8Decoder = new TextDecoder('utf-8')
    let read = ''
    while (true) {
        // Read a chunk and decode it to a UTF-8 string
        const {done, value} = await reader.read()
        if (value) {
            read += utf8Decoder.decode(value, {stream: true})
        }

        // If we read too much data, end the stream, truncate the data, and return
        if (read.length >= limit) {
            await reader.cancel('Reached limit')
            return read.substring(0, limit)
        }

        if (done) {
            break
        }
    }

    return read
}
