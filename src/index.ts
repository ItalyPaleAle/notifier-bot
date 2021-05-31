import {Method} from 'tiny-request-router'

import router from './routes'

// Register all activities
import './activities'
import {ErrorResponse, InternalServerErrorResponse} from './lib/utils'
import {HttpStatusCode} from './lib/http-status-codes'

// Main entry point for Workers
addEventListener('fetch', (event: FetchEvent) => {
    const req = event.request
    const {pathname} = new URL(req.url)

    const match = router.match(req.method as Method, pathname)
    if (match) {
        // The handler can add promises to manage in background to this array
        const background: Promise<any>[] = []
        // Wrap in a Promise to ensure it's asynchronous
        const response = Promise.resolve(match.handler(req, match.params, background))
            .then((res) => {
                // Perform all background requests
                if (background.length) {
                    event.waitUntil(Promise.all(background))
                }
                // Return the response
                return res
            })
            .catch((err) => {
                if (typeof err == 'object') {
                    // We may have a Response object already
                    if (err instanceof Response) {
                        return err
                    } else if (err instanceof Error) {
                        console.error('Caught error', err.message, err.stack)
                    }
                } else {
                    console.error('Caught error', err)
                }
                return InternalServerErrorResponse()
            })
        event.respondWith(response)
    } else {
        // Return a 404
        event.respondWith(
            ErrorResponse({
                status: HttpStatusCode.NotFound,
                message: 'Not found',
            })
        )
    }
})
