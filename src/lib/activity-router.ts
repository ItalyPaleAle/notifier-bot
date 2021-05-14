// Imported for types only
import {Activity, ActivityTypes} from 'botframework-schema'

/**
 * Function used to determine if a route matches this activity
 * @param activity The Activity object that was received
 * @returns The function should return `true` if the route should be processed by this callback
 */
export type ActivityRouteMatchFunction = (activity: Activity) => boolean

/**
 * Used to determine if the route should be processed by this callback by setting certain simplified criteria.
 * At least one criterion is required. If more than one is specified, matches require all to be satisfied.
 */
export type ActivityRouteMatchObject = {
    /** Match activity type */
    type?: ActivityTypes | string
    /**Match activity's text */
    text?: string | RegExp
    /** Use a function to determine if the route matches this activity */
    matchFunc?: ActivityRouteMatchFunction
}

/** Used to determine if the route should be processed by this callback. */
export type ActivityRouteMatch = ActivityRouteMatchFunction | ActivityRouteMatchObject

/**
 * Route callback that processes activities. Can be async
 * @param activity The Activity object that was received
 */
export type ActivityRoute = (activity: Activity) => Promise<void> | void

/**
 * Router for activity messages received from Bot Service
 */
export class ActivityRouter {
    private routes: Map<ActivityRouteMatchObject, ActivityRoute>

    constructor() {
        this.routes = new Map()
    }

    /**
     * Adds a new route
     * @param match Parameters to match the route
     * @param callback Callback for the route
     */
    add(match: ActivityRouteMatch, callback: ActivityRoute) {
        if (!match || !callback || typeof callback != 'function') {
            throw Error('Arguments match and callback are required')
        }
        // If the match argument is just a function, convert it to an object
        if (typeof match == 'function') {
            match = {
                matchFunc: match,
            }
        }
        if (!match.type && !match.text && !match.matchFunc) {
            throw Error('At least one matching condition is required')
        }
        this.routes.set(match, callback)
    }

    /**
     * Returns the first callback matching the activity.
     * @param activity Activity object
     * @returns Callback matching the activity
     */
    find(activity: Activity): ActivityRoute | null {
        // Find the first route that matches
        for (const [match, callback] of this.routes) {
            // Try matching activity type
            if (match.type && activity.type.toLowerCase() != match.type) {
                continue
            }
            // Try matching activity's text
            if (match.text) {
                if (typeof match.text == 'string' && activity.text != match.text) {
                    continue
                } else if (
                    typeof match.text == 'object' &&
                    match.text instanceof RegExp &&
                    !activity.text.match(match.text)
                ) {
                    continue
                }
            }
            // Try invoking the callback
            if (match.matchFunc && !match.matchFunc(activity)) {
                continue
            }
            // If we're here, we found the first matching route
            return callback
        }

        // No route found
        return null
    }
}

/** Instance of ActivityRouter */
export const activityRouter = new ActivityRouter()
export default activityRouter
