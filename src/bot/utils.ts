import {Activity, Mention} from 'botframework-schema'

/**
 * Removes mentions from an activity's text
 * @param activity The incoming Activity object
 * @param userIds If set, will remove mentions of these users only; otherwise, all mentions are removed
 * @returns text with mentions removed (and surrounding whitespaces trimmed)
 */
export function RemoveMentions(activity: Partial<Activity>, userIds?: string[]): string {
    if (!activity?.text) {
        throw Error('text property is empty in the activity object')
    }

    // If there are no entities, there are no mentions (but trim the result anyways)
    if (!activity.entities || !activity.entities.length) {
        return activity.text.trim()
    }

    // Retrieve all mentions for the user IDs we want to remove
    let resultText = activity.text
    for (let i = 0; i < activity.entities.length; i++) {
        const e = activity.entities[i] as Mention
        if (e && e.type.toLowerCase() == 'mention' && e.mentioned?.id && e.text) {
            // If we need to filter by some user IDs only
            if (userIds?.length && !userIds.includes(e.mentioned.id)) {
                continue
            }
            // Replace the mention in the text
            resultText = resultText.replace(e.text, '')
        }
    }

    // Trim the result
    return resultText.trim()
}

/**
 * Normalizes the conversation.id property.
 * If the activity comes from a channel, we don't want to respond in a thread, but just send a new message to the same channel.
 * Note that this method modified the `activity` parameter.
 * @param activity The object with the incoming activity
 */
export function NormalizeConversationId(activity: Activity) {
    if ((activity.conversation.conversationType || '').toLowerCase() == 'channel') {
        // Property to use can either be channelData.channel.id or channelData.teamsChannelId
        if (activity.channelData?.channel?.id) {
            activity.conversation.id = activity.channelData.channel.id
        } else if (activity.channelData?.teamsChannelId) {
            activity.conversation.id = activity.channelData.teamsChannelId
        }
    }
}
