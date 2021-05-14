// Import types only
import {Activity} from 'botframework-schema'

import {webhookPrefixLength, maxWebhooksPerConversation} from '../lib/webhooks'
import BotClient from '../bot/client'
import {NormalizeConversationId} from '../bot/utils'
import {SHA256String} from '../lib/crypto'

// Handler for the "list webhook(s)" command
export default async (activity: Activity) => {
    if (!activity?.conversation || !activity.conversation.id) {
        throw Error('conversation.id missing in activity object')
    }

    // Normalize the conversation id
    NormalizeConversationId(activity)
    //console.log(JSON.stringify(activity, undefined, '  '))

    // Retrieve the list of webhooks, using the conversation ID as prefix
    // The prefix is the first N characters of the (base64-encoded) hash of the conversation ID
    const prefix = (await SHA256String(activity.conversation.id)).substring(
        0,
        webhookPrefixLength
    )
    const res = await WEBHOOKS.list({
        prefix,
        // Add a buffer (Workers KV is only eventually consistent)
        limit: maxWebhooksPerConversation + 5,
    })

    // Send a message to the client with the list of all webhooks
    const client = new BotClient(
        activity.serviceUrl,
        activity.conversation,
        activity.recipient,
        activity.from
    )
    // We must await on this otherwise there would be a fetch invocation outside of a running request in the worker
    await client.sendToConversation(buildMessage(res.keys))
}

function buildMessage(keys: {name: string}[]): Partial<Activity> {
    if (!keys || !keys.length) {
        return {
            type: 'message',
            text: `I can't find any webhook for this conversation`,
        }
    }

    // Sort keys alphabetically
    keys.sort()

    // List all items
    const cardEntries: any[] = []
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i].name
        cardEntries.push({
            type: 'ColumnSet',
            columns: [
                {
                    type: 'Column',
                    width: 'stretch',
                    separator: true,
                    items: [
                        {
                            type: 'TextBlock',
                            text: k,
                            wrap: true,
                            spacing: 'Small',
                            fontType: 'Monospace',
                        },
                    ],
                },
                {
                    type: 'Column',
                    width: 'auto',
                    items: [
                        {
                            type: 'ActionSet',
                            actions: [
                                {
                                    type: 'Action.Submit',
                                    id: 'delete/' + k,
                                    title: '🗑',
                                    data: {
                                        payload: {
                                            action: 'delete',
                                            id: k,
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        })
    }

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
                    body: cardEntries,
                },
            },
        ],
    }
}
