// Importing types only
import {Activity, ActivityTimestamps} from 'botframework-schema'

import {HttpStatusCode} from '../lib/http-status-codes'
import {Handler} from '../lib/types'
import {ErrorResponse} from '../lib/utils'
import {CheckAuth} from '../auth'
import activityRouter from '../lib/activity-router'

/**
 * Handler for the POST /bot/message route, where Bot Framework sends messages to
 *
 * @param req Request object
 * @returns Response object for the request
 */
const handler: Handler = async (req: Request) => {
    // Ensure the request is authorized
    const auth = await CheckAuth(req)
    if (!auth || auth.error) {
        return ErrorResponse({
            status: HttpStatusCode.Unauthorized,
            message: auth?.error || 'Unauthorized',
        })
    }

    // Parse the Activity object from the body, then validate it and convert dates from strings to Date objects
    const activity = (await req.json()) as Activity
    if (typeof activity != 'object') {
        throw Error(`Invalid activity: invalid body`)
    }
    if (typeof activity.type != 'string') {
        throw Error(`Invalid activity: missing type`)
    }
    if (typeof activity.timestamp == 'string') {
        ;(activity as ActivityTimestamps).rawTimestamp = activity.timestamp
        activity.timestamp = new Date(activity.timestamp)
    }
    if (typeof activity.expiration == 'string') {
        ;(activity as ActivityTimestamps).rawExpiration = activity.expiration
        activity.expiration = new Date(activity.expiration)
    }
    if (typeof activity.localTimestamp == 'string') {
        ;(activity as ActivityTimestamps).rawLocalTimestamp =
            activity.localTimestamp
        activity.localTimestamp = new Date(activity.localTimestamp)
    }

    // Find a callback to process this activity
    const callback = activityRouter.find(activity)
    if (callback) {
        // Note that the callback could be synchronous
        await callback(activity)
    }

    return new Response('OK', {
        status: HttpStatusCode.Ok,
    })
}
export default handler
