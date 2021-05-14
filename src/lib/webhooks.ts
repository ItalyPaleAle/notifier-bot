import {Activity, ChannelAccount, ConversationAccount} from 'botframework-schema'
import {customAlphabet} from 'nanoid'
import {SHA256String} from './crypto'

/** Data stored in the KV value */
export type WebhookObject = {
    key: string
    conversation: ConversationAccount
    serviceUrl: string
    bot: ChannelAccount
    user: ChannelAccount
}

/** Max number of webhooks per conversation */
export const maxWebhooksPerConversation = 5

/** Length of the webhook ID */
export const webhookIdLength = 10

/** Length of the prefix for the webhook ID */
export const webhookPrefixLength = 12

/** Regexp to match a webhook ID */
export const webhookIdFormat =
    /^[A-Za-z0-9-_]{12}\/[6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz]{10}$/

/** Regexp to match the webhook key (with optional "Bearer " prefix) */
export const webhookKeyFormat =
    /^(Bearer )?(SK_[6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz]{22})$/

/** Error raised when the conversation already has too many webhooks */
export const TooManyWebhooksError = new Error('too-many-webhooks')

// Nanoid's with a custom alphabet
// We are removing lookalike characters, symbols, and letters/numbers that may allow inappropriate words
const nanoidId = customAlphabet('6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz', webhookIdLength)
const nanoidKey = customAlphabet('6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz', 22)

export async function NewWebhook(activity: Activity): Promise<{id: string; key: string}> {
    // Get the hash of the conversation ID and grab the first 12 characters (bas64-encoded)
    // This will be used as prefix for the webhook ID
    const conversationIdHash = await SHA256String(activity.conversation.id)
    const prefix = conversationIdHash.substring(0, webhookPrefixLength)

    // Retrieve all webhooks for this conversation and ensure we're not over the limit
    const res = await WEBHOOKS.list({
        prefix,
        // Add 1 to see if we're over
        limit: maxWebhooksPerConversation + 1,
    })
    if (res?.keys && res.keys.length >= maxWebhooksPerConversation) {
        throw TooManyWebhooksError
    }

    // Generate a new webhook
    const webhookId = prefix + '/' + nanoidId()
    const webhookKey = 'SK_' + nanoidKey()

    // Calculate the hash of the webhook key
    // This uses only 1 round of SHA256, but the input should have decent entropy already
    // Regardless, it's more for extra peace of mind than anything else
    const webhookKeyHash = await SHA256String(webhookKey)

    // Set the webhook ID for this conversation
    await WEBHOOKS.put(
        webhookId,
        JSON.stringify({
            key: webhookKeyHash,
            conversation: activity.conversation,
            serviceUrl: activity.serviceUrl,
            bot: activity.recipient,
            user: activity.from,
        } as WebhookObject)
    )

    return {
        id: webhookId,
        key: webhookKey,
    }
}
