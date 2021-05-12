import {Method} from 'tiny-request-router'

import router from './routes'

// Register all activities
import './activities'
import {InternalServerErrorResponse} from './lib/utils'

// Main entry point for Workers
addEventListener('fetch', (event: FetchEvent) => {
    const req = event.request
    const {pathname} = new URL(req.url)

    const match = router.match(req.method as Method, pathname)
    if (match) {
        event.respondWith(
            // Wrap in a Promise to ensure it's asynchronous
            Promise.resolve(match.handler(req, match.params)).catch((err) => {
                if (typeof err == 'object' && err instanceof Error) {
                    console.error('Caught error', err.message, err.stack)
                } else {
                    console.error('Caught error', err)
                }
                return InternalServerErrorResponse()
            })
        )
    }
})
