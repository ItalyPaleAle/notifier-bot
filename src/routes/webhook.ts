// Importing types only
import {Activity} from 'botframework-schema'
import {Params} from 'tiny-request-router'

import {webhookIdFormat, webhookKeyFormat, WebhookObject} from '../lib/webhooks'
import {HttpStatusCode} from '../lib/http-status-codes'
import {Handler} from '../lib/types'
import {
    ErrorResponse,
    ErrorResponseOpts,
    InternalServerErrorResponse,
    LimitReader,
} from '../lib/utils'
import BotClient from '../bot/client'
import {SHA256String} from '../lib/crypto'

/** Type for the body of JSON-formatted webhook calls */
type WebhookJSONRequest = {
    message: string
}

/**
 * Maximum amount of data to read from the request body
 * Note that this is a number of characters, as the length is calculated with `Strings.prototype.length`
 */
const MaxBodySize = 4 << 10

/**
 * Handler for the POST /webhook/:id route, to receive webhook messages
 *
 * @param req Request object
 * @returns Response object for the request
 */
const handler: Handler = async (
    req: Request,
    params: Params,
    background: Promise<any>[]
) => {
    // Get the webhook ID
    const webhookId = params?.id
    if (!webhookId || !webhookId.match(webhookIdFormat)) {
        return ErrorResponse({
            status: HttpStatusCode.BadRequest,
            message: 'Invalid webhook ID',
        })
    }

    // Validate the authorization header for this request
    const auth = await validateAuthHeader(req, webhookId)
    if (auth.error) {
        return ErrorResponse(auth.error)
    }
    if (!auth.webhookObj) {
        return InternalServerErrorResponse()
    }

    // Read from the request body with a limit, to avoid loading too much data in memory
    const read = await LimitReader(req.body!, MaxBodySize)
    if (!read) {
        return ErrorResponse({
            message: 'Request body is empty',
            status: HttpStatusCode.BadRequest,
        })
    }

    // Get the message to send and the content type
    // Split to get the part until ; only, in case there's an encoding added
    const ct = (req.headers.get('content-type') || '').toLowerCase().split(';')[0]
    let message = ''
    switch (ct) {
        // JSON-formatted requests
        case 'application/json':
            try {
                const body = JSON.parse(read) as WebhookJSONRequest
                if (!body || !body.message) {
                    return ErrorResponse({
                        message: `Missing key 'message' in the request body`,
                        status: HttpStatusCode.BadRequest,
                    })
                }
                message = body.message
            } catch (err) {
                return ErrorResponse({
                    message: `Request body is not formatted as valid JSON`,
                    status: HttpStatusCode.BadRequest,
                })
            }
            break

        // Plain-text requests
        case 'text/plain':
            try {
                message = read
            } catch (err) {
                return ErrorResponse({
                    message: `Request body could not be read`,
                    status: HttpStatusCode.BadRequest,
                })
            }
            break

        default:
            return ErrorResponse({
                message:
                    'This webhook accepts requests in plain text (text/plain) or JSON (application/json) formats only',
                status: HttpStatusCode.UnsupportedMediaType,
            })
    }

    // Send the message to the client
    const client = new BotClient(
        auth.webhookObj.serviceUrl,
        auth.webhookObj.conversation,
        auth.webhookObj.bot,
        auth.webhookObj.user
    )
    // In a worker, all fetch calls must be tied to a fetch event. To avoid pausing the incoming request, add this to the list of background requests
    background.push(client.sendToConversation(buildMessage(webhookId, message)))

    return new Response('OK', {
        status: HttpStatusCode.Accepted,
    })
}

async function validateAuthHeader(
    req: Request,
    webhookId: string
): Promise<{error?: ErrorResponseOpts; webhookObj?: WebhookObject}> {
    // Get the auth token, from the "Authorization" header first and then the querystring
    let auth: string = ''
    const authHeader = req.headers.get('authorization')
    if (authHeader) {
        // Match the correct format - "Bearer " is optional
        const match = authHeader.match(webhookKeyFormat)
        if (match && match[2]) {
            auth = match[2]
        }
    }
    // Try the "access_token" from the querystring as fallback
    if (!auth) {
        const url = new URL(req.url)
        const match = (url.searchParams.get('access_token') || '').match(webhookKeyFormat)
        if (match && match[2]) {
            auth = match[2]
        }
    }

    // Still no (valid) authorization? Return an error
    if (!auth) {
        return {
            error: {
                status: HttpStatusCode.Unauthorized,
                message: 'Invalid authorization',
            },
        }
    }

    // Calculate the SHA256 hash to compare with the value in the KV
    const authHash = await SHA256String(auth)

    // Retrieve the value from the KV
    const stored = await WEBHOOKS.get(webhookId)
    if (!stored) {
        return {
            error: {
                status: HttpStatusCode.Unauthorized,
                message: 'Invalid authorization',
            },
        }
    }
    const parsed = JSON.parse(stored) as WebhookObject
    if (
        !parsed ||
        parsed.key != authHash ||
        !parsed.conversation?.id ||
        !parsed.bot?.id ||
        !parsed.user?.id
    ) {
        return {
            error: {
                status: HttpStatusCode.Unauthorized,
                message: 'Invalid authorization',
            },
        }
    }

    // All good
    return {webhookObj: parsed}
}

function buildMessage(recipientId: string, message: string): Partial<Activity> {
    return {
        type: 'message',
        text: '',
        attachments: [
            {
                contentType: 'application/vnd.microsoft.card.adaptive',
                content: {
                    type: 'AdaptiveCard',
                    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                    version: '1.2',
                    body: [
                        {
                            type: 'TextBlock',
                            text: 'I received a message through a webhook:',
                            wrap: true,
                            color: 'Accent',
                            weight: 'Bolder',
                        },
                        {
                            type: 'TextBlock',
                            text: message,
                            wrap: true,
                            //separator: true,
                        },
                        {
                            type: 'TextBlock',
                            text: 'Webhook ID: ' + recipientId,
                            size: 'Small',
                            isSubtle: true,
                            separator: true,
                            weight: 'Lighter',
                        },
                    ],
                },
            },
        ],
    }
}

export default handler
