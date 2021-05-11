//import {customAlphabet} from '../../node_modules/nanoid/index.prod'
import {customAlphabet} from 'nanoid'

/** Data stored in the KV value */
export type WebhookObject = {
    key: string
    conversation: string
}

// Nanoid's with a custom alphabet
// We are removing lookalike characters, symbols, and letters/numbers that may allow inappropriate words
const nanoidId = customAlphabet('6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz', 14)
const nanoidKey = customAlphabet('6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz', 22)

export async function NewWebhook(
    conversation: string
): Promise<{id: string; key: string}> {
    // Generate a new webhook
    const webhookId = nanoidId()
    const webhookKey = nanoidKey()

    // Set the webhook ID for this conversation
    await WEBHOOKS.put(
        webhookId,
        JSON.stringify({
            key: webhookKey,
            conversation,
        })
    )

    return {
        id: webhookId,
        key: webhookKey,
    }
}
