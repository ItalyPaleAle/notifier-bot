import {
    Activity,
    ChannelAccount,
    ConversationAccount,
    ResourceResponse,
} from 'botframework-schema'
import {HttpStatusCode} from '../lib/http-status-codes'
import accessToken from './access-token'

/**
 * Class used to send messages to clients.
 * Note that each client is unique to a combination of conversation, sender, and recipient.
 */
export class BotClient {
    private serviceUrl: string
    private conversation: ConversationAccount
    private from: ChannelAccount
    private recipient: ChannelAccount

    constructor(
        serviceUrl: string,
        conversation: ConversationAccount,
        from: ChannelAccount,
        recipient: ChannelAccount
    ) {
        this.serviceUrl = serviceUrl
        this.conversation = conversation
        this.from = from
        this.recipient = recipient

        // Override the serviceUrl in development
        if (SERVICE_URL_OVERRIDE) {
            this.serviceUrl = SERVICE_URL_OVERRIDE
        }
    }

    /**
     * Sends an activity to a conversation
     * @param activity Activity object
     * @param text Text to send
     * @returns The response object, containing the ID of the activity that was sent (if any)
     */
    public async sendToConversation(text: string): Promise<Partial<ResourceResponse>>
    public async sendToConversation(
        activity: Partial<Activity>
    ): Promise<Partial<ResourceResponse>>
    public async sendToConversation(
        textOrActivity: Partial<Activity> | string
    ): Promise<Partial<ResourceResponse>> {
        if (!textOrActivity) {
            throw Error('Paramter text/activity is required')
        }
        const activity = this.activityParam(textOrActivity)

        // Override the from, conversation, and recipient fields with the values set in the client
        activity.from = this.from
        activity.conversation = this.conversation
        activity.recipient = this.recipient

        // Send the request
        return this.sendActivity(
            '/v3/conversations/' + activity.conversation.id + '/activities',
            activity
        )
    }

    /**
     * Replies to an activity
     * @param activityId ID of the activity to reply to
     * @param activity Activity object
     * @param text Text to send
     * @returns The response object, containing the ID of the activity that was sent (if any)
     */
    public async replyToActivity(
        activityId: string,
        activity: Partial<Activity>
    ): Promise<Partial<ResourceResponse>>
    public async replyToActivity(
        activityId: string,
        text: string
    ): Promise<Partial<ResourceResponse>>
    public async replyToActivity(
        activityId: string,
        textOrActivity: Partial<Activity> | string
    ): Promise<Partial<ResourceResponse>> {
        if (!activityId || !textOrActivity) {
            throw Error('Parameters activityId and activity/text are required')
        }
        const activity = this.activityParam(textOrActivity)

        // Override the from, conversation, and recipient fields with the values set in the client
        activity.from = this.from
        activity.conversation = this.conversation
        activity.recipient = this.recipient

        // Send the request
        return this.sendActivity(
            '/v3/conversations/' + activity.conversation.id + '/activities/' + activityId,
            activity
        )
    }

    /**
     * Internal function that ensures that the input is always an Activity object
     * @param textOrActivity Activity object or text message
     * @returns Always an Activity object
     */
    private activityParam(textOrActivity: Partial<Activity> | string): Partial<Activity> {
        switch (typeof textOrActivity) {
            case 'string':
                return {
                    type: 'message',
                    text: textOrActivity,
                }
            case 'object':
                return textOrActivity
            default:
                throw Error('Invalid activity/text parameter')
        }
    }

    /**
     * Updates an activity
     * @param activityId ID of the activity to update
     * @param activity Updated activity object
     * @returns The response object, containing the ID of the activity that was updated (if any)
     */
    public async updateActivity(
        activityId: string,
        activity: Partial<Activity>
    ): Promise<Partial<ResourceResponse>> {
        if (!activityId || !activity) {
            throw Error('Parameters activityId and activity are required')
        }
        if (!activity.conversation?.id) {
            throw Error('conversation.id missing in the activity object')
        }

        // Send the request
        return this.sendActivity(
            '/v3/conversations/' + activity.conversation.id + '/activities/' + activityId,
            activity,
            'PUT'
        )
    }

    /**
     * Internal method that sends an activity to a specific API method.
     * It is used by methods like `sendToConversation` and `replyToActivity`.
     * @param method API method
     * @param activity Activity object
     * @param httpVerb HTTP verb to use (default: `POST`)
     * @returns The response object, containing the ID of the activity that was sent (if any)
     */
    private async sendActivity(
        method: string,
        activity: Partial<Activity>,
        httpVerb?: 'POST' | 'PUT'
    ): Promise<Partial<ResourceResponse>> {
        // Ensure that required values are set
        if (!method || !activity) {
            throw Error('Parameters method and activity are required')
        }
        if (activity.type == '') {
            throw Error('Empty type field for the activity')
        }
        if (!httpVerb) {
            httpVerb = 'POST'
        }

        // Send the request
        const bearerToken = await accessToken.getToken()
        const res = await fetch(this.serviceUrl + method, {
            method: httpVerb,
            body: JSON.stringify(activity),
            headers: {
                authorization: 'Bearer ' + bearerToken,
                'content-type': 'application/json',
            },
        })
        if (!res.ok) {
            throw Error('Invalid response status code: ' + res.status)
        }

        // We may or may not have a response
        // There's no response if status code is a 2xx status code but not 200 (OK)
        let data = {} as Partial<ResourceResponse>
        if (res.status == HttpStatusCode.Ok) {
            const dataText = await res.text()
            if (dataText.length) {
                try {
                    data = JSON.parse(dataText) as Partial<ResourceResponse>
                } catch (err) {
                    console.log('Error parsing JSON response', dataText, err)
                }
            }
        }
        return data
    }
}

export default BotClient
