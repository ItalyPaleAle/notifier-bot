// Import types only
import {Activity} from 'botframework-schema'
import {NormalizeConversationId} from '../bot/utils'

import {NewWebhook, TooManyWebhooksError} from '../lib/webhooks'
import BotClient from '../bot/client'

// Handler for the "new webhook" command
export default async (activity: Activity) => {
    if (!activity?.conversation || !activity.conversation.id) {
        throw Error('conversation.id missing in activity object')
    }

    // Normalize the conversation id
    NormalizeConversationId(activity)

    // Create a client to respond
    const client = new BotClient(
        activity.serviceUrl,
        activity.conversation,
        activity.recipient,
        activity.from
    )

    // Generate a new webhook
    let message: Partial<Activity>
    try {
        const webhook = await NewWebhook(activity)
        message = buildMessage(webhook.id, webhook.key)
    } catch (err) {
        if (err == TooManyWebhooksError) {
            // Send the error message
            message = {
                type: 'message',
                text: `Sorry, this conversation has already reached the maximum number of webhooks and I can't add another one`,
            }
        } else {
            // Re-throw
            throw err
        }
    }

    // We must await on this otherwise there would be a fetch invocation outside of a running request in the worker
    await client.sendToConversation(message)
}

function buildMessage(webhookId: string, webhookKey: string): Partial<Activity> {
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
                            text: `Here's the webhook I've created for you:`,
                            wrap: true,
                            color: 'Accent',
                            weight: 'Bolder',
                        },
                        {
                            type: 'Container',
                            items: [
                                {
                                    type: 'TextBlock',
                                    text: 'Webhook URL:',
                                    spacing: 'Small',
                                },
                                {
                                    type: 'TextBlock',
                                    text: `${BASE_URL}/webhook/${webhookId}`,
                                    fontType: 'Monospace',
                                    wrap: true,
                                    spacing: 'Small',
                                },
                            ],
                        },
                        {
                            type: 'Container',
                            items: [
                                {
                                    type: 'TextBlock',
                                    text: 'Access token:',
                                    spacing: 'Small',
                                },
                                {
                                    type: 'TextBlock',
                                    text: webhookKey,
                                    fontType: 'Monospace',
                                    wrap: true,
                                    spacing: 'Small',
                                },
                            ],
                            separator: true,
                        },
                    ],
                },
            },
        ],
    }
}
