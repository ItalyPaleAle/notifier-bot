import {Handler} from './lib/types'
import {Router} from 'tiny-request-router'
import {ErrorResponse} from './lib/utils'
import {HttpStatusCode} from './lib/http-status-codes'

// Router for the Worker
const router = new Router<Handler>()

// Routes
router.get(
    '/hello/:name',
    async (req, params) => new Response(`Hello ${params.name}!`)
)

// Catch-all route that returns with a 404
router.all('*', () => {
    return ErrorResponse({
        status: HttpStatusCode.NotFound,
        message: 'Not found',
    })
})

export default router
