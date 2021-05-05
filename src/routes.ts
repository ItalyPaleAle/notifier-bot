import {Handler} from './lib/types'
import {Router} from 'tiny-request-router'
import {ErrorResponse} from './lib/utils'
import {HttpStatusCode} from './lib/http-status-codes'

import IncomingMessageRoute from './route-incoming-message'

// Router for the Worker
const router = new Router<Handler>()

// Routes
router.post('/bot/message', IncomingMessageRoute)

// Catch-all route that returns with a 404
router.all('*', () => {
    return ErrorResponse({
        status: HttpStatusCode.NotFound,
        message: 'Not found',
    })
})

export default router
