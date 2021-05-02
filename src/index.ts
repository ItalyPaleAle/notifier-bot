import {Method} from 'tiny-request-router'

import router from './routes'

// Main entry point for Workers
addEventListener('fetch', (event: FetchEvent) => {
    const req = event.request
    const {pathname} = new URL(req.url)

    const match = router.match(req.method as Method, pathname)
    if (match) {
        event.respondWith(match.handler(req, match.params))
    }
})
