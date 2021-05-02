import {Params} from 'tiny-request-router'

// Type for handlers
export type Handler = (
    request: Request,
    params: Params
) => Promise<Response> | Response
