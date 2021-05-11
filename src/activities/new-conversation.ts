import {NewWebhook} from '../lib/webhooks'
// Import types only
import {Activity} from 'botframework-schema'

// On new conversations, create a new webhook for them
export default async (activity: Activity) => {
    //console.log(JSON.stringify(activity, undefined, '  '))
    if (!activity?.conversation || !activity.conversation.id) {
        throw Error('conversation.id missing in activity object')
    }

    // Generate a new webhook
    const webhook = await NewWebhook(activity.conversation.id)
    console.log(webhook.id, webhook.key)
}
