import {Encode as B64Encode} from './base64'
import {ConversationAccount} from 'botframework-schema'
import {customAlphabet} from 'nanoid'

/** Data stored in the KV value */
export type WebhookObject = {
    key: string
    conversation: string
}

// Nanoid's with a custom alphabet
// We are removing lookalike characters, symbols, and letters/numbers that may allow inappropriate words
const nanoidId = customAlphabet('6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz', 16)
const nanoidKey = customAlphabet('6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz', 22)

export async function NewWebhook(
    conversation: ConversationAccount
): Promise<{id: string; key: string}> {
    // Generate a new webhook
    const webhookId = nanoidId()
    const webhookKey = 'SK_' + nanoidKey()

    // Calculate the hash of the webhook key
    // This uses only 1 round of SHA256, but the input should have decent entropy already
    // Regardless, it's more for extra peace of mind than anything else
    const buf = new TextEncoder().encode(webhookKey)
    const webhookKeyHash = await crypto.subtle.digest('SHA-256', buf)

    // Set the webhook ID for this conversation
    await WEBHOOKS.put(
        webhookId,
        JSON.stringify({
            key: B64Encode(webhookKeyHash),
            conversation,
        })
    )

    return {
        id: webhookId,
        key: webhookKey,
    }
}
