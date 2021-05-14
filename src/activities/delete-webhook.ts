// Import types only
import {Activity} from 'botframework-schema'

import {webhookPrefixLength} from '../lib/webhooks'
import BotClient from '../bot/client'
import {NormalizeConversationId} from '../bot/utils'
import {SHA256String} from '../lib/crypto'
import {ErrorResponse} from '../lib/utils'
import {HttpStatusCode} from '../lib/http-status-codes'

// Handler for the "delete" action
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
    //console.log(JSON.stringify(activity, undefined, '  '))

    // Calculate the hash of this conversation ID and use it as authentication for deleting the webhook
    // The prefix is the first N characters of the (base64-encoded) hash of the conversation ID
    const prefix = (await SHA256String(activity.conversation.id)).substring(
        0,
        webhookPrefixLength
    )

    // Check if the prefix matches what's in the webhookId
    if (!webhookId.startsWith(prefix)) {
        console.error(
            `Trying to remove webhook ${webhookId} from conversation with prefix ${prefix}`
        )
        throw ErrorResponse({
            status: HttpStatusCode.Forbidden,
            message: 'Cannot remove a webhook that is not assigned to this conversation',
        })
    }

    // Delete the webhook
    await WEBHOOKS.delete(webhookId)

    // Client to respond to messages
    const client = new BotClient(
        activity.serviceUrl,
        activity.conversation,
        activity.recipient,
        activity.from
    )
    // We must await on this otherwise there would be a fetch invocation outside of a running request in the worker
    await client.sendToConversation(
        `Ok, I've removed the webhook from this chat (Note: it may take up to a minute for it to be removed)`
    )
}
