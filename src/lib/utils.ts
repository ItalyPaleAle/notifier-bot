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
