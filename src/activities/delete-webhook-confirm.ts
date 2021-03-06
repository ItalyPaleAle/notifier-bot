// Import types only
import {Activity} from 'botframework-schema'

import {webhookPrefixLength} from '../lib/webhooks'
import BotClient from '../bot/client'
import {NormalizeConversationId} from '../bot/utils'
import {SHA256String} from '../lib/crypto'
import {ErrorResponse} from '../lib/utils'
import {HttpStatusCode} from '../lib/http-status-codes'

// Timeout before delete requests expire
// This is for safety in case people forget what the request is about and click on that long time after
const deleteRequestTimeout = 5 * 60 * 1000

// Handler for the "delete/confirm" action
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

    // Client to respond to messages
    const client = new BotClient(
        activity.serviceUrl,
        activity.conversation,
        activity.recipient,
        activity.from
    )

    // Check if the message is older than the timeout
    // If there's no time in the request, then ignore this step
    if (activity.value?.payload?.date) {
        const date = new Date(activity.value.payload.date as string)
        if (date.getTime() + deleteRequestTimeout < Date.now()) {
            // We must await on this otherwise there would be a fetch invocation outside of a running request in the worker
            await client.sendToConversation(
                `Sorry, this action has expired. Please try again!`
            )
            return
        }
    }

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

    // We must await on this otherwise there would be a fetch invocation outside of a running request in the worker
    await client.sendToConversation(
        `Ok, I've removed the webhook from this chat (Note: it may take up to a minute for the operation to complete)`
    )
}
