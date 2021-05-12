import {Encode as B64Encode} from './base64'
import {Activity, ChannelAccount, ConversationAccount} from 'botframework-schema'
import {customAlphabet} from 'nanoid'

/** Data stored in the KV value */
export type WebhookObject = {
    key: string
    conversation: ConversationAccount
    serviceUrl: string
    bot: ChannelAccount
    user: ChannelAccount
}

/** Length of the webhook ID */
export const webhookIdLength = 16

/** Regexp to match a webhook ID */
export const webhookIdFormat = /^[6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz]{16}$/

/** Regexp to match the webhook key (with optional "Bearer " prefix) */
export const webhookKeyFormat =
    /^(Bearer )?(SK_[6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz]{22})$/

// Nanoid's with a custom alphabet
// We are removing lookalike characters, symbols, and letters/numbers that may allow inappropriate words
const nanoidId = customAlphabet('6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz', webhookIdLength)
const nanoidKey = customAlphabet('6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz', 22)

export async function NewWebhook(activity: Activity): Promise<{id: string; key: string}> {
    // Generate a new webhook
    const webhookId = nanoidId()
    const webhookKey = 'SK_' + nanoidKey()

    // Calculate the hash of the webhook key
    // This uses only 1 round of SHA256, but the input should have decent entropy already
    // Regardless, it's more for extra peace of mind than anything else
    const webhookKeyHash = await HashWebhookKey(webhookKey)

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

/**
 * Returns the SHA-256 hash of the webhook key
 * @param webhookKey Webhook key to hash
 * @returns The SHA-256 hash of the key
 */
export async function HashWebhookKey(webhookKey: string): Promise<string> {
    const buf = new TextEncoder().encode(webhookKey)
    const webhookKeyHash = await crypto.subtle.digest('SHA-256', buf)
    return B64Encode(webhookKeyHash)
}
