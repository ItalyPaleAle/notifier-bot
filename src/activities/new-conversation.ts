import {NewWebhook} from '../lib/webhooks'
import BotClient from '../bot/client'
// Import types only
import {Activity} from 'botframework-schema'

// On new conversations, create a new webhook for them
export default async (activity: Activity) => {
    //console.log(JSON.stringify(activity, undefined, '  '))
    if (!activity?.conversation || !activity.conversation.id) {
        throw Error('conversation.id missing in activity object')
    }

    // Generate a new webhook
    const webhook = await NewWebhook(activity)

    // Send a message to the client with the credentials to the webhook
    const client = new BotClient(
        activity.serviceUrl,
        activity.conversation,
        activity.recipient,
        activity.from
    )
    // We must await on this otherwise there would be a fetch invocation outside of a running request in the worker
    await client.sendToConversation(buildMessage(webhook.id, webhook.key))
}

function buildMessage(webhookId: string, webhookKey: string): Partial<Activity> {
    return {
        type: 'message',
        text: `Here's the webhook I've created for you:`,
        attachments: [
            {
                contentType: 'application/vnd.microsoft.card.adaptive',
                content: {
                    type: 'AdaptiveCard',
                    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                    version: '1.2',
                    body: [
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
