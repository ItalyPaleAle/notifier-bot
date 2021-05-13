import {Handler} from './lib/types'
import {Router} from 'tiny-request-router'

import WebhookRoute from './routes/webhook'
import IncomingMessageRoute from './routes/incoming-message'

// Router for the Worker
const router = new Router<Handler>()

// Routes
router.post('/webhook/:id', WebhookRoute)
router.post('/bot/message', IncomingMessageRoute)

export default router
