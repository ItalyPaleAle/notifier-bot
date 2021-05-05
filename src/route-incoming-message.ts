import {HttpStatusCode} from './lib/http-status-codes'
import {Handler} from './lib/types'
import {ErrorResponse} from './lib/utils'
import {CheckAuth} from './auth'

/**
 * Handler for the GET /bot/message route, where Bot Framework sends messages to
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

    return new Response('OK')
}
export default handler
