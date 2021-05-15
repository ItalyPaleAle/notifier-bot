// Import types only
import {Activity} from 'botframework-schema'

import BotClient from '../bot/client'
import {NormalizeConversationId} from '../bot/utils'

// Handler for the "delete" action
// This asks for confirmation before continuing
export default async (activity: Activity) => {
    if (!activity?.conversation || !activity.conversation.id) {
        throw Error('conversation.id missing in activity object')
    }

    const webhookId = activity.value?.payload?.id as string
    if (!webhookId) {
        throw Error('value.payload.id is missing in activity object')
    }

    // Normalize the conversation id
    NormalizeConversationId(activity)

    // Client to respond to messages
    const client = new BotClient(
        activity.serviceUrl,
        activity.conversation,
        activity.recipient,
        activity.from
    )
    // We must await on this otherwise there would be a fetch invocation outside of a running request in the worker
    await client.sendToConversation(buildMessage(webhookId))
}

function buildMessage(webhookId: string): Partial<Activity> {
    const payload = {
        action: 'delete/confirm',
        id: webhookId,
        date: new Date().toUTCString(),
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
                    body: [
                        {
                            type: 'Container',
                            id: 'canceled',
                            items: [
                                {
                                    type: 'TextBlock',
                                    text: `Ok, I won't delete it`,
                                    wrap: true,
                                },
                            ],
                            isVisible: false,
                        },
                        {
                            type: 'Container',
                            id: 'question',
                            items: [
                                {
                                    type: 'TextBlock',
                                    text: `Are you sure you want to delete the webhook "${webhookId}"?`,
                                    wrap: true,
                                },
                                {
                                    type: 'ActionSet',
                                    actions: [
                                        {
                                            type: 'Action.ToggleVisibility',
                                            title: 'Cancel',
                                            targetElements: ['question', 'canceled'],
                                        },
                                        {
                                            type: 'Action.Submit',
                                            title: 'Delete',
                                            id: 'confirm',
                                            style: 'destructive',
                                            data: {
                                                payload: payload,
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            },
        ],
    }
}
